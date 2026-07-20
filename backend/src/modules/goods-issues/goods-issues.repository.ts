import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { insertAuditLog } from '../../common/audit/audit.repository';
import { buildUniqueCode } from '../../common/code/code-generator';
import { reverseInventoryReference } from '../../common/inventory/reversal.repository';
import { db } from '../../database/db';
import type { AllocationStrategy } from '../stock/stock.model';
import type {
  ConfirmGoodsIssueInput,
  ConfirmGoodsIssueResult,
  ReverseGoodsIssueInput,
  ReverseGoodsIssueResult,
  GoodsIssueDemand,
  GoodsIssueItemRow,
  GoodsIssueRow,
  GoodsIssuesFilters,
  GoodsIssuesRow,
  QueryParams,
  CreateGoodsIssueInput,
} from './goods-issues.model';

const tableName = 'goods_issues';

type GoodsIssueAllocationInsert = {
  goods_issue_id: number;
  product_variant_id: number;
  batch_id: number | null;
  location_id: number;
  quantity: number;
  note: string | null;
};

type StockAllocationLockRow = RowDataPacket & {
  stock_location_id: number;
  product_variant_id: number;
  location_id: number;
  batch_id: number | null;
  quantity: number;
  available_quantity: number;
  requires_lot_tracking: 0 | 1;
  requires_expiry_tracking: 0 | 1;
  expiry_date: Date | null;
  received_date: Date | null;
};

function allocationOrderBy(strategy: AllocationStrategy): string {
  if (strategy === 'FEFO') {
    return `
      CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END,
      pb.expiry_date ASC,
      pb.received_date ASC,
      pb.id ASC,
      wl.code ASC
    `;
  }

  return `
    CASE WHEN pb.received_date IS NULL THEN 1 ELSE 0 END,
    pb.received_date ASC,
    pb.id ASC,
    wl.code ASC
  `;
}

function buildInventoryTransactionCode(issueCode: string): string {
  return buildUniqueCode('ISSUE', issueCode);
}

export async function findGoodsIssues(
  filters: GoodsIssuesFilters,
): Promise<GoodsIssuesRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('issue_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<GoodsIssuesRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}

async function lockGoodsIssue(
  connection: PoolConnection,
  issueId: number,
): Promise<GoodsIssueRow | undefined> {
  const [rows] = await connection.query<GoodsIssueRow[]>(
    `
      SELECT id, issue_code, warehouse_id, status
      FROM goods_issues
      WHERE id = ?
      FOR UPDATE
    `,
    [issueId],
  );

  return rows[0];
}

async function lockGoodsIssueItems(
  connection: PoolConnection,
  issueId: number,
): Promise<GoodsIssueItemRow[]> {
  const [rows] = await connection.query<GoodsIssueItemRow[]>(
    `
      SELECT
        id,
        goods_issue_id,
        product_variant_id,
        batch_id,
        location_id,
        quantity,
        note
      FROM goods_issue_items
      WHERE goods_issue_id = ?
      ORDER BY id
      FOR UPDATE
    `,
    [issueId],
  );

  return rows;
}

function aggregateDemand(items: GoodsIssueItemRow[]): GoodsIssueDemand[] {
  const demandByVariant = new Map<number, number>();

  for (const item of items) {
    demandByVariant.set(
      item.product_variant_id,
      (demandByVariant.get(item.product_variant_id) ?? 0) +
        Number(item.quantity),
    );
  }

  return [...demandByVariant.entries()].map(([productVariantId, quantity]) => ({
    productVariantId,
    quantity,
  }));
}

async function lockAllocationCandidates(
  connection: PoolConnection,
  warehouseId: number,
  productVariantId: number,
  strategy: AllocationStrategy,
): Promise<StockAllocationLockRow[]> {
  const [rows] = await connection.query<StockAllocationLockRow[]>(
    `
      SELECT
        sl.id AS stock_location_id,
        sl.product_variant_id,
        sl.location_id,
        sl.batch_id,
        sl.quantity,
        sl.available_quantity,
        pv.requires_lot_tracking,
        pv.requires_expiry_tracking,
        pb.expiry_date,
        pb.received_date
      FROM stock_locations sl
      JOIN product_variants pv ON pv.id = sl.product_variant_id
      JOIN warehouse_locations wl ON wl.id = sl.location_id
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      LEFT JOIN product_batches pb ON pb.id = sl.batch_id
      WHERE wz.warehouse_id = ?
        AND sl.product_variant_id = ?
        AND sl.available_quantity > 0
        AND (pb.status IS NULL OR pb.status NOT IN ('EXPIRED', 'BLOCKED', 'DEPLETED'))
        AND (pb.expiry_date IS NULL OR pb.expiry_date >= CURRENT_DATE)
      ORDER BY ${allocationOrderBy(strategy)}
      FOR UPDATE
    `,
    [warehouseId, productVariantId],
  );

  return rows;
}

async function replaceIssueItemsWithAllocations(
  connection: PoolConnection,
  issueId: number,
  allocations: GoodsIssueAllocationInsert[],
): Promise<void> {
  await connection.query(
    'DELETE FROM goods_issue_items WHERE goods_issue_id = ?',
    [issueId],
  );

  for (const allocation of allocations) {
    await connection.query(
      `
        INSERT INTO goods_issue_items (
          goods_issue_id,
          product_variant_id,
          batch_id,
          location_id,
          quantity,
          note
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        issueId,
        allocation.product_variant_id,
        allocation.batch_id,
        allocation.location_id,
        allocation.quantity,
        allocation.note,
      ],
    );
  }
}

async function countIssueTransactions(
  connection: PoolConnection,
  issueId: number,
): Promise<number> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT id
      FROM inventory_transactions
      WHERE reference_type = 'GOODS_ISSUE'
        AND reference_id = ?
    `,
    [issueId],
  );

  return rows.length;
}

export async function confirmGoodsIssueTransaction(
  input: ConfirmGoodsIssueInput,
): Promise<ConfirmGoodsIssueResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const issue = await lockGoodsIssue(connection, input.issueId);

    if (!issue) {
      throw new Error('GOODS_ISSUE_NOT_FOUND');
    }

    if (issue.status === 'CONFIRMED') {
      const transactionCount = await countIssueTransactions(
        connection,
        issue.id,
      );
      await connection.commit();

      return {
        issueId: issue.id,
        issueCode: issue.issue_code,
        status: 'CONFIRMED',
        strategy: input.strategy,
        transactionCount,
      };
    }

    if (!['DRAFT', 'PENDING'].includes(issue.status)) {
      throw new Error('GOODS_ISSUE_NOT_CONFIRMABLE');
    }

    const originalItems = await lockGoodsIssueItems(connection, issue.id);

    if (originalItems.length === 0) {
      throw new Error('GOODS_ISSUE_HAS_NO_ITEMS');
    }

    const demand = aggregateDemand(originalItems);
    const allocations: GoodsIssueAllocationInsert[] = [];
    let transactionCount = 0;

    for (const demandItem of demand) {
      let remainingQuantity = demandItem.quantity;
      const candidates = await lockAllocationCandidates(
        connection,
        issue.warehouse_id,
        demandItem.productVariantId,
        input.strategy,
      );

      for (const candidate of candidates) {
        if (remainingQuantity <= 0) {
          break;
        }

        if (candidate.requires_lot_tracking === 1 && !candidate.batch_id) {
          throw new Error('BATCH_REQUIRED');
        }

        if (
          input.strategy === 'FEFO' &&
          candidate.requires_expiry_tracking === 1 &&
          !candidate.expiry_date
        ) {
          throw new Error('EXPIRY_DATE_REQUIRED');
        }

        const issueQuantity = Math.min(
          Number(candidate.available_quantity),
          remainingQuantity,
        );
        const quantityBefore = Number(candidate.quantity);
        const quantityAfter = quantityBefore - issueQuantity;

        if (issueQuantity <= 0) {
          continue;
        }

        const [updateResult] = await connection.query<ResultSetHeader>(
          `
            UPDATE stock_locations
            SET quantity = quantity - ?, version = version + 1
            WHERE id = ?
              AND quantity - reserved_quantity >= ?
          `,
          [issueQuantity, candidate.stock_location_id, issueQuantity],
        );

        if (updateResult.affectedRows !== 1) {
          throw new Error('CONCURRENT_STOCK_UPDATE');
        }

        allocations.push({
          goods_issue_id: issue.id,
          product_variant_id: candidate.product_variant_id,
          batch_id: candidate.batch_id,
          location_id: candidate.location_id,
          quantity: issueQuantity,
          note: `Allocated by ${input.strategy}`,
        });

        await connection.query(
          `
            INSERT INTO inventory_transactions (
              transaction_code,
              transaction_type,
              warehouse_id,
              product_variant_id,
              batch_id,
              source_location_id,
              destination_location_id,
              quantity,
              quantity_before,
              quantity_after,
              reference_type,
              reference_id,
              note,
              performed_by,
              approved_by
            )
            VALUES (?, 'ISSUE', ?, ?, ?, ?, NULL, ?, ?, ?, 'GOODS_ISSUE', ?, ?, ?, ?)
          `,
          [
            buildInventoryTransactionCode(issue.issue_code),
            issue.warehouse_id,
            candidate.product_variant_id,
            candidate.batch_id,
            candidate.location_id,
            issueQuantity,
            quantityBefore,
            quantityAfter,
            issue.id,
            `Confirmed goods issue ${issue.issue_code} by ${input.strategy}`,
            input.confirmedBy,
            input.confirmedBy,
          ],
        );

        transactionCount += 1;
        remainingQuantity -= issueQuantity;
      }

      if (remainingQuantity > 0) {
        throw new Error('INSUFFICIENT_STOCK');
      }
    }

    await replaceIssueItemsWithAllocations(connection, issue.id, allocations);

    await insertAuditLog(connection, {
      userId: input.confirmedBy,
      action: 'CONFIRM',
      module: 'goods_issues',
      entityType: 'GOODS_ISSUE',
      entityId: issue.id,
      oldValues: { status: issue.status },
      newValues: {
        status: 'CONFIRMED',
        strategy: input.strategy,
        transactionCount,
      },
    });

    await connection.query(
      `
        UPDATE goods_issues
        SET
          status = 'CONFIRMED',
          confirmed_by = ?,
          confirmed_at = CURRENT_TIMESTAMP(3),
          issued_at = COALESCE(issued_at, CURRENT_TIMESTAMP(3))
        WHERE id = ?
      `,
      [input.confirmedBy, issue.id],
    );

    await connection.commit();

    return {
      issueId: issue.id,
      issueCode: issue.issue_code,
      status: 'CONFIRMED',
      strategy: input.strategy,
      transactionCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reverseGoodsIssueTransaction(
  input: ReverseGoodsIssueInput,
): Promise<ReverseGoodsIssueResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const issue = await lockGoodsIssue(connection, input.issueId);

    if (!issue) {
      throw new Error('GOODS_ISSUE_NOT_FOUND');
    }

    if (issue.status === 'CANCELLED') {
      await connection.commit();
      return {
        issueId: issue.id,
        issueCode: issue.issue_code,
        status: 'CANCELLED',
        reversalCount: 0,
      };
    }

    if (issue.status !== 'CONFIRMED') {
      throw new Error('GOODS_ISSUE_NOT_REVERSIBLE');
    }

    const reversalCount = await reverseInventoryReference(connection, {
      referenceType: 'GOODS_ISSUE',
      referenceId: issue.id,
      reversedBy: input.reversedBy,
      note: `Reversed goods issue ${issue.issue_code}`,
    });

    await insertAuditLog(connection, {
      userId: input.reversedBy,
      action: 'REVERSE',
      module: 'goods_issues',
      entityType: 'GOODS_ISSUE',
      entityId: issue.id,
      oldValues: { status: issue.status },
      newValues: { status: 'CANCELLED', reversalCount },
    });

    await connection.query(
      `
        UPDATE goods_issues
        SET status = 'CANCELLED', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.reversedBy, issue.id],
    );

    await connection.commit();

    return {
      issueId: issue.id,
      issueCode: issue.issue_code,
      status: 'CANCELLED',
      reversalCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function insertGoodsIssue(
  input: CreateGoodsIssueInput,
): Promise<{ id: number }> {
  const [warehouseRows] = await db.query<Array<RowDataPacket & { id: number }>>(
    'SELECT id FROM warehouses WHERE id = ? OR code = ? LIMIT 1',
    [input.warehouseId ?? 0, 'KHO-HCM-01'],
  );
  const [userRows] = await db.query<Array<RowDataPacket & { id: number }>>(
    'SELECT id FROM users WHERE id = ? OR employee_code = ? LIMIT 1',
    [input.createdBy ?? 0, 'NV-KHO-01'],
  );
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO goods_issues (issue_code, warehouse_id, status, reference_no, note, created_by)
     VALUES (?, ?, 'DRAFT', ?, ?, ?)`,
    [
      input.issueCode,
      warehouseRows[0]?.id,
      input.referenceNo ?? null,
      input.note ?? null,
      userRows[0]?.id,
    ],
  );
  return { id: result.insertId };
}
