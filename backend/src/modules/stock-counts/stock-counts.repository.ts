import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { insertAuditLog } from '../../common/audit/audit.repository';
import { buildUniqueCode } from '../../common/code/code-generator';
import { db } from '../../database/db';
import type {
  ApproveStockCountInput,
  ApproveStockCountResult,
  CreateStockCountInput,
  CreateStockCountResult,
  QueryParams,
  RecordStockCountItemInput,
  RecordStockCountItemResult,
  SnapshotStockRow,
  StartStockCountInput,
  StartStockCountResult,
  StockCountItemRow,
  StockCountRow,
  StockCountsFilters,
  StockCountsRow,
  SubmitStockCountInput,
  SubmitStockCountResult,
} from './stock-counts.model';

const tableName = 'stock_counts';

type CountSummaryRow = RowDataPacket & {
  total_items: number;
  counted_items: number;
};

export async function findStockCounts(
  filters: StockCountsFilters,
): Promise<StockCountsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('count_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<StockCountsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}

export async function findStockCountItems(
  stockCountId: number,
): Promise<StockCountItemRow[]> {
  const [rows] = await db.query<StockCountItemRow[]>(
    `
      SELECT
        sci.*,
        pv.sku,
        p.name AS product_name,
        pv.variant_name,
        wl.code AS location_code,
        pb.lot_number
      FROM stock_count_items sci
      JOIN product_variants pv ON pv.id = sci.product_variant_id
      JOIN products p ON p.id = pv.product_id
      JOIN warehouse_locations wl ON wl.id = sci.location_id
      LEFT JOIN product_batches pb ON pb.id = sci.batch_id
      WHERE sci.stock_count_id = ?
      ORDER BY sci.id
    `,
    [stockCountId],
  );

  return rows;
}

async function lockCount(
  connection: PoolConnection,
  stockCountId: number,
): Promise<StockCountRow | undefined> {
  const [rows] = await connection.query<StockCountRow[]>(
    `
      SELECT
        id,
        count_code,
        warehouse_id,
        scope_type,
        scope_reference_id,
        status,
        assigned_to,
        created_by
      FROM stock_counts
      WHERE id = ?
      FOR UPDATE
    `,
    [stockCountId],
  );

  return rows[0];
}

async function lockCountItem(
  connection: PoolConnection,
  stockCountId: number,
  itemId: number,
): Promise<StockCountItemRow | undefined> {
  const [rows] = await connection.query<StockCountItemRow[]>(
    `
      SELECT *
      FROM stock_count_items
      WHERE stock_count_id = ?
        AND id = ?
      FOR UPDATE
    `,
    [stockCountId, itemId],
  );

  return rows[0];
}

function buildSnapshotScopeWhere(input: CreateStockCountInput): {
  sql: string;
  params: Array<number>;
} {
  const where = ['w.id = ?'];
  const params = [input.warehouseId];

  if (input.scopeType === 'ZONE') {
    where.push('wz.id = ?');
    params.push(Number(input.scopeReferenceId));
  }

  if (input.scopeType === 'SHELF') {
    where.push('ws.id = ?');
    params.push(Number(input.scopeReferenceId));
  }

  if (input.scopeType === 'LOCATION') {
    where.push('wl.id = ?');
    params.push(Number(input.scopeReferenceId));
  }

  if (input.scopeType === 'SKU') {
    where.push('pv.id = ?');
    params.push(Number(input.scopeReferenceId));
  }

  if (input.scopeType === 'CATEGORY') {
    where.push('p.category_id = ?');
    params.push(Number(input.scopeReferenceId));
  }

  return { sql: where.join(' AND '), params };
}

async function getSnapshotRows(
  connection: PoolConnection,
  input: CreateStockCountInput,
): Promise<SnapshotStockRow[]> {
  const scope = buildSnapshotScopeWhere(input);
  const [rows] = await connection.query<SnapshotStockRow[]>(
    `
      SELECT
        sl.product_variant_id,
        sl.batch_id,
        sl.location_id,
        sl.quantity
      FROM stock_locations sl
      JOIN product_variants pv ON pv.id = sl.product_variant_id
      JOIN products p ON p.id = pv.product_id
      JOIN warehouse_locations wl ON wl.id = sl.location_id
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      JOIN warehouses w ON w.id = wz.warehouse_id
      WHERE ${scope.sql}
        AND sl.quantity > 0
      ORDER BY wl.id, pv.id, sl.batch_id
      FOR UPDATE
    `,
    scope.params,
  );

  if (rows.length > 0) return rows;

  // Fallback: If no stock_locations with quantity > 0 exist in this scope,
  // query available locations and active product variants so users can count empty/new locations.
  const [fallbackRows] = await connection.query<SnapshotStockRow[]>(
    `
      SELECT
        pv.id AS product_variant_id,
        NULL AS batch_id,
        wl.id AS location_id,
        0 AS quantity
      FROM warehouse_locations wl
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      JOIN warehouses w ON w.id = wz.warehouse_id
      CROSS JOIN (
        SELECT id FROM product_variants WHERE status = 'ACTIVE' LIMIT 1
      ) pv
      WHERE ${scope.sql}
      ORDER BY wl.id
      LIMIT 50
    `,
    scope.params,
  );

  return fallbackRows;
}

async function getCountSummary(
  connection: PoolConnection,
  stockCountId: number,
): Promise<CountSummaryRow> {
  const [rows] = await connection.query<CountSummaryRow[]>(
    `
      SELECT
        COUNT(*) AS total_items,
        SUM(CASE WHEN actual_quantity IS NULL THEN 0 ELSE 1 END) AS counted_items
      FROM stock_count_items
      WHERE stock_count_id = ?
    `,
    [stockCountId],
  );

  return rows[0] ?? { total_items: 0, counted_items: 0 };
}

async function lockCountItems(
  connection: PoolConnection,
  stockCountId: number,
): Promise<StockCountItemRow[]> {
  const [rows] = await connection.query<StockCountItemRow[]>(
    `
      SELECT *
      FROM stock_count_items
      WHERE stock_count_id = ?
      ORDER BY id
      FOR UPDATE
    `,
    [stockCountId],
  );

  return rows;
}

export async function createStockCountTransaction(
  input: CreateStockCountInput,
): Promise<CreateStockCountResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const snapshotRows = await getSnapshotRows(connection, input);

    if (snapshotRows.length === 0) {
      throw new Error('STOCK_COUNT_SNAPSHOT_EMPTY');
    }

    const countCode = buildUniqueCode('COUNT', input.warehouseId);
    const [insertResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO stock_counts (
          count_code,
          warehouse_id,
          scope_type,
          scope_reference_id,
          status,
          assigned_to,
          created_by,
          note
        )
        VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?)
      `,
      [
        countCode,
        input.warehouseId,
        input.scopeType,
        input.scopeReferenceId ?? null,
        input.assignedTo ?? null,
        input.createdBy,
        input.note ?? null,
      ],
    );

    for (const row of snapshotRows) {
      await connection.query(
        `
          INSERT INTO stock_count_items (
            stock_count_id,
            product_variant_id,
            batch_id,
            location_id,
            system_quantity
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          insertResult.insertId,
          row.product_variant_id,
          row.batch_id,
          row.location_id,
          row.quantity,
        ],
      );
    }

    await insertAuditLog(connection, {
      userId: input.createdBy,
      action: 'CREATE',
      module: 'stock_counts',
      entityType: 'STOCK_COUNT',
      entityId: insertResult.insertId,
      newValues: {
        status: 'DRAFT',
        itemCount: snapshotRows.length,
        scopeType: input.scopeType,
      },
    });

    await connection.commit();

    return {
      stockCountId: insertResult.insertId,
      countCode,
      status: 'DRAFT',
      itemCount: snapshotRows.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function startStockCountTransaction(
  input: StartStockCountInput,
): Promise<StartStockCountResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const stockCount = await lockCount(connection, input.stockCountId);

    if (!stockCount) {
      throw new Error('STOCK_COUNT_NOT_FOUND');
    }

    if (stockCount.status === 'IN_PROGRESS') {
      await connection.commit();
      return {
        stockCountId: stockCount.id,
        countCode: stockCount.count_code,
        status: 'IN_PROGRESS',
      };
    }

    if (stockCount.status !== 'DRAFT') {
      throw new Error('STOCK_COUNT_NOT_STARTABLE');
    }

    await connection.query(
      `
        UPDATE stock_counts
        SET status = 'IN_PROGRESS', snapshot_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [stockCount.id],
    );

    await insertAuditLog(connection, {
      userId: input.startedBy,
      action: 'START',
      module: 'stock_counts',
      entityType: 'STOCK_COUNT',
      entityId: stockCount.id,
      oldValues: { status: stockCount.status },
      newValues: { status: 'IN_PROGRESS' },
    });

    await connection.commit();

    return {
      stockCountId: stockCount.id,
      countCode: stockCount.count_code,
      status: 'IN_PROGRESS',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function recordStockCountItemTransaction(
  input: RecordStockCountItemInput,
): Promise<RecordStockCountItemResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const stockCount = await lockCount(connection, input.stockCountId);

    if (!stockCount) {
      throw new Error('STOCK_COUNT_NOT_FOUND');
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      throw new Error('STOCK_COUNT_NOT_COUNTABLE');
    }

    const item = await lockCountItem(
      connection,
      input.stockCountId,
      input.itemId,
    );

    if (!item) {
      throw new Error('STOCK_COUNT_ITEM_NOT_FOUND');
    }

    const differenceQuantity =
      input.actualQuantity - Number(item.system_quantity);

    await connection.query(
      `
        UPDATE stock_count_items
        SET
          actual_quantity = ?,
          reason_code = ?,
          note = ?,
          counted_by = ?,
          counted_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [
        input.actualQuantity,
        input.reasonCode ?? null,
        input.note ?? null,
        input.countedBy,
        item.id,
      ],
    );

    await connection.commit();

    return {
      itemId: item.id,
      actualQuantity: input.actualQuantity,
      differenceQuantity,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function submitStockCountTransaction(
  input: SubmitStockCountInput,
): Promise<SubmitStockCountResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const stockCount = await lockCount(connection, input.stockCountId);

    if (!stockCount) {
      throw new Error('STOCK_COUNT_NOT_FOUND');
    }

    if (stockCount.status === 'SUBMITTED') {
      const summary = await getCountSummary(connection, stockCount.id);
      await connection.commit();
      return {
        stockCountId: stockCount.id,
        countCode: stockCount.count_code,
        status: 'SUBMITTED',
        countedItems: Number(summary.counted_items),
        totalItems: Number(summary.total_items),
      };
    }

    if (stockCount.status !== 'IN_PROGRESS') {
      throw new Error('STOCK_COUNT_NOT_SUBMITTABLE');
    }

    const summary = await getCountSummary(connection, stockCount.id);

    if (Number(summary.total_items) === 0) {
      throw new Error('STOCK_COUNT_HAS_NO_ITEMS');
    }

    if (Number(summary.counted_items) !== Number(summary.total_items)) {
      throw new Error('STOCK_COUNT_HAS_UNCOUNTED_ITEMS');
    }

    await connection.query(
      `
        UPDATE stock_counts
        SET
          status = 'SUBMITTED',
          submitted_by = ?,
          submitted_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.submittedBy, stockCount.id],
    );

    await insertAuditLog(connection, {
      userId: input.submittedBy,
      action: 'SUBMIT',
      module: 'stock_counts',
      entityType: 'STOCK_COUNT',
      entityId: stockCount.id,
      oldValues: { status: stockCount.status },
      newValues: { status: 'SUBMITTED' },
    });

    await connection.commit();

    return {
      stockCountId: stockCount.id,
      countCode: stockCount.count_code,
      status: 'SUBMITTED',
      countedItems: Number(summary.counted_items),
      totalItems: Number(summary.total_items),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function approveStockCountTransaction(
  input: ApproveStockCountInput,
): Promise<ApproveStockCountResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const stockCount = await lockCount(connection, input.stockCountId);

    if (!stockCount) {
      throw new Error('STOCK_COUNT_NOT_FOUND');
    }

    if (stockCount.status === 'APPROVED') {
      const [adjustmentRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id, adjustment_code
          FROM stock_adjustments
          WHERE stock_count_id = ?
          LIMIT 1
        `,
        [stockCount.id],
      );
      const adjustment = adjustmentRows[0] as
        | (RowDataPacket & { id: number; adjustment_code: string })
        | undefined;
      const items = adjustment
        ? await lockCountItems(connection, stockCount.id)
        : [];
      await connection.commit();

      return {
        stockCountId: stockCount.id,
        countCode: stockCount.count_code,
        status: 'APPROVED',
        adjustmentId: adjustment?.id ?? null,
        adjustmentCode: adjustment?.adjustment_code ?? null,
        adjustmentItemCount: items.filter(
          (item) => Number(item.difference_quantity ?? 0) !== 0,
        ).length,
      };
    }

    if (stockCount.status !== 'SUBMITTED') {
      throw new Error('STOCK_COUNT_NOT_APPROVABLE');
    }

    const items = await lockCountItems(connection, stockCount.id);

    if (items.length === 0) {
      throw new Error('STOCK_COUNT_HAS_NO_ITEMS');
    }

    if (items.some((item) => item.actual_quantity === null)) {
      throw new Error('STOCK_COUNT_HAS_UNCOUNTED_ITEMS');
    }

    const differenceItems = items.filter(
      (item) => Number(item.difference_quantity ?? 0) !== 0,
    );
    let adjustmentId: number | null = null;
    let adjustmentCode: string | null = null;

    if (differenceItems.length > 0) {
      adjustmentCode = buildUniqueCode('ADJ-COUNT', stockCount.count_code);
      const [adjustmentInsert] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO stock_adjustments (
            adjustment_code,
            warehouse_id,
            stock_count_id,
            adjustment_type,
            status,
            reason_code,
            note,
            created_by,
            submitted_by,
            submitted_at
          )
          VALUES (?, ?, ?, 'COUNT', 'PENDING', 'COUNT_VARIANCE', ?, ?, ?, CURRENT_TIMESTAMP(3))
        `,
        [
          adjustmentCode,
          stockCount.warehouse_id,
          stockCount.id,
          `Generated from stock count ${stockCount.count_code}`,
          stockCount.created_by,
          input.approvedBy,
        ],
      );
      adjustmentId = adjustmentInsert.insertId;

      for (const item of differenceItems) {
        const differenceQuantity = Number(item.difference_quantity);
        await connection.query(
          `
            INSERT INTO stock_adjustment_items (
              stock_adjustment_id,
              product_variant_id,
              batch_id,
              location_id,
              adjustment_direction,
              quantity,
              reason_code,
              note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            adjustmentId,
            item.product_variant_id,
            item.batch_id,
            item.location_id,
            differenceQuantity > 0 ? 'IN' : 'OUT',
            Math.abs(differenceQuantity),
            item.reason_code ?? 'COUNT_VARIANCE',
            item.note,
          ],
        );
      }
    }

    await connection.query(
      `
        UPDATE stock_counts
        SET
          status = 'APPROVED',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.approvedBy, stockCount.id],
    );

    await insertAuditLog(connection, {
      userId: input.approvedBy,
      action: 'APPROVE',
      module: 'stock_counts',
      entityType: 'STOCK_COUNT',
      entityId: stockCount.id,
      oldValues: { status: stockCount.status },
      newValues: {
        status: 'APPROVED',
        adjustmentId,
        adjustmentItemCount: differenceItems.length,
      },
    });

    await connection.commit();

    return {
      stockCountId: stockCount.id,
      countCode: stockCount.count_code,
      status: 'APPROVED',
      adjustmentId,
      adjustmentCode,
      adjustmentItemCount: differenceItems.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
