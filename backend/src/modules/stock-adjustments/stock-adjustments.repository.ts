import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { insertAuditLog } from '../../common/audit/audit.repository';
import { buildUniqueCode } from '../../common/code/code-generator';
import { generateDocumentCode } from '../../common/code/document-code';
import { db } from '../../database/db';
import type {
  ApproveStockAdjustmentInput,
  ApproveStockAdjustmentResult,
  CancelStockAdjustmentInput,
  CancelStockAdjustmentResult,
  QueryParams,
  CreateStockAdjustmentInput,
  RejectStockAdjustmentInput,
  RejectStockAdjustmentResult,
  StockAdjustmentItemRow,
  StockAdjustmentRow,
  StockAdjustmentsFilters,
  StockAdjustmentsRow,
} from './stock-adjustments.model';

const tableName = 'stock_adjustments';

type StockLocationRow = RowDataPacket & {
  id: number;
  quantity: number;
  reserved_quantity: number;
};

async function lockStockLocation(
  connection: PoolConnection,
  productVariantId: number,
  locationId: number,
  batchId: number | null,
): Promise<StockLocationRow | undefined> {
  const [rows] = await connection.query<StockLocationRow[]>(
    `
      SELECT id, quantity, reserved_quantity
      FROM stock_locations
      WHERE product_variant_id = ?
        AND location_id = ?
        AND (batch_id <=> ?)
      FOR UPDATE
    `,
    [productVariantId, locationId, batchId],
  );

  return rows[0];
}

export async function findStockAdjustments(
  filters: StockAdjustmentsFilters,
): Promise<StockAdjustmentsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('sa.id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('sa.adjustment_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('sa.status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<StockAdjustmentsRow[]>({
    sql: `
      SELECT
        sa.*,
        u_created.full_name AS created_by_name,
        u_approved.full_name AS approved_by_name
      FROM ${tableName} sa
      LEFT JOIN users u_created ON u_created.id = sa.created_by
      LEFT JOIN users u_approved ON u_approved.id = sa.approved_by
      ${whereSql}
      ORDER BY sa.id DESC
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}

export async function findStockAdjustmentDetail(
  id: number,
): Promise<{ header: RowDataPacket; items: RowDataPacket[] } | undefined> {
  const [headers] = await db.query<RowDataPacket[]>(
    `
      SELECT
        sa.*,
        w.code AS warehouse_code,
        w.name AS warehouse_name,
        u_created.full_name AS created_by_name,
        u_approved.full_name AS approved_by_name,
        u_rejected.full_name AS rejected_by_name
      FROM stock_adjustments sa
      LEFT JOIN warehouses w ON w.id = sa.warehouse_id
      LEFT JOIN users u_created ON u_created.id = sa.created_by
      LEFT JOIN users u_approved ON u_approved.id = sa.approved_by
      LEFT JOIN users u_rejected ON u_rejected.id = sa.rejected_by
      WHERE sa.id = ?
      LIMIT 1
    `,
    [id],
  );

  const header = headers[0];
  if (!header) return undefined;

  const [items] = await db.query<RowDataPacket[]>(
    `
      SELECT
        sai.*,
        pv.sku,
        pv.variant_name AS variant_name,
        p.name AS product_name,
        pb.lot_number,
        pb.expiry_date,
        wl.code AS location_code
      FROM stock_adjustment_items sai
      LEFT JOIN product_variants pv ON pv.id = sai.product_variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      LEFT JOIN product_batches pb ON pb.id = sai.batch_id
      LEFT JOIN warehouse_locations wl ON wl.id = sai.location_id
      WHERE sai.stock_adjustment_id = ?
      ORDER BY sai.id
    `,
    [id],
  );

  return { header, items };
}
async function lockAdjustment(
  connection: PoolConnection,
  adjustmentId: number,
): Promise<StockAdjustmentRow | undefined> {
  const [rows] = await connection.query<StockAdjustmentRow[]>(
    `
      SELECT id, adjustment_code, warehouse_id, adjustment_type, status, created_by
      FROM stock_adjustments
      WHERE id = ?
      FOR UPDATE
    `,
    [adjustmentId],
  );

  return rows[0];
}

async function lockAdjustmentItems(
  connection: PoolConnection,
  adjustmentId: number,
): Promise<StockAdjustmentItemRow[]> {
  const [rows] = await connection.query<StockAdjustmentItemRow[]>(
    `
      SELECT
        sai.id,
        sai.stock_adjustment_id,
        sai.product_variant_id,
        sai.batch_id,
        sai.location_id,
        sai.adjustment_direction,
        sai.quantity,
        sai.reason_code,
        sai.note,
        pb.product_variant_id AS batch_variant_id
      FROM stock_adjustment_items sai
      LEFT JOIN product_batches pb ON pb.id = sai.batch_id
      WHERE sai.stock_adjustment_id = ?
      ORDER BY sai.id
      FOR UPDATE
    `,
    [adjustmentId],
  );

  return rows;
}

async function assertLocationInWarehouse(
  connection: PoolConnection,
  locationId: number,
  warehouseId: number,
): Promise<void> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT wl.id
      FROM warehouse_locations wl
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      WHERE wl.id = ?
        AND wz.warehouse_id = ?
      LIMIT 1
    `,
    [locationId, warehouseId],
  );

  if (rows.length === 0) {
    throw new Error('LOCATION_WAREHOUSE_MISMATCH');
  }
}

async function ensureStockLocationForIncrease(
  connection: PoolConnection,
  item: StockAdjustmentItemRow,
): Promise<{ id: number; before: number }> {
  const existing = await lockStockLocation(
    connection,
    item.product_variant_id,
    item.location_id,
    item.batch_id,
  );

  if (existing) {
    return { id: existing.id, before: Number(existing.quantity) };
  }

  const [insertResult] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO stock_locations (
        product_variant_id,
        location_id,
        batch_id,
        quantity
      )
      VALUES (?, ?, ?, 0)
    `,
    [item.product_variant_id, item.location_id, item.batch_id],
  );

  return { id: insertResult.insertId, before: 0 };
}

export async function approveStockAdjustmentTransaction(
  input: ApproveStockAdjustmentInput,
): Promise<ApproveStockAdjustmentResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const adjustment = await lockAdjustment(connection, input.adjustmentId);

    if (!adjustment) {
      throw new Error('STOCK_ADJUSTMENT_NOT_FOUND');
    }

    if (adjustment.status === 'APPROVED') {
      const [transactionRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id
          FROM inventory_transactions
          WHERE reference_type = 'STOCK_ADJUSTMENT'
            AND reference_id = ?
        `,
        [adjustment.id],
      );
      await connection.commit();

      return {
        adjustmentId: adjustment.id,
        adjustmentCode: adjustment.adjustment_code,
        status: 'APPROVED',
        transactionCount: transactionRows.length,
      };
    }

    if (!['DRAFT', 'PENDING'].includes(adjustment.status)) {
      throw new Error('STOCK_ADJUSTMENT_NOT_APPROVABLE');
    }

    const items = await lockAdjustmentItems(connection, adjustment.id);

    if (items.length === 0) {
      throw new Error('STOCK_ADJUSTMENT_HAS_NO_ITEMS');
    }

    let transactionCount = 0;

    for (const item of items) {
      // Khóa ngoại chỉ bảo đảm lô tồn tại, không bảo đảm lô thuộc đúng sản phẩm
      // của dòng hàng; thiếu kiểm tra này thì tồn kho mang hạn dùng của sản phẩm khác.
      if (item.batch_id && item.batch_variant_id !== item.product_variant_id) {
        throw new Error('BATCH_VARIANT_MISMATCH');
      }

      await assertLocationInWarehouse(
        connection,
        item.location_id,
        adjustment.warehouse_id,
      );

      let stockLocationId: number;
      let before: number;

      if (item.adjustment_direction === 'IN') {
        const stockLocation = await ensureStockLocationForIncrease(
          connection,
          item,
        );
        stockLocationId = stockLocation.id;
        before = stockLocation.before;
      } else {
        const stockLocation = await lockStockLocation(
          connection,
          item.product_variant_id,
          item.location_id,
          item.batch_id,
        );

        if (!stockLocation) {
          throw new Error('STOCK_LOCATION_NOT_FOUND');
        }

        const reserved = Number(stockLocation.reserved_quantity ?? 0);
        if (Number(stockLocation.quantity) - reserved < Number(item.quantity)) {
          throw new Error('INSUFFICIENT_STOCK');
        }

        stockLocationId = stockLocation.id;
        before = Number(stockLocation.quantity);
      }

      const quantity = Number(item.quantity);
      const after =
        item.adjustment_direction === 'IN'
          ? before + quantity
          : before - quantity;

      if (after < 0) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const transactionType =
        adjustment.adjustment_type === 'COUNT'
          ? item.adjustment_direction === 'IN'
            ? 'COUNT_ADJUSTMENT_IN'
            : 'COUNT_ADJUSTMENT_OUT'
          : item.adjustment_direction === 'IN'
            ? 'MANUAL_ADJUSTMENT_IN'
            : 'MANUAL_ADJUSTMENT_OUT';

      const [updateResult] = await connection.query<ResultSetHeader>(
        `
          UPDATE stock_locations
          SET quantity = ?, version = version + 1
          WHERE id = ?
            AND ? >= 0
        `,
        [after, stockLocationId, after],
      );

      if (updateResult.affectedRows !== 1) {
        throw new Error('CONCURRENT_STOCK_UPDATE');
      }

      await connection.query(
        `
          UPDATE stock_adjustment_items
          SET quantity_before = ?, quantity_after = ?
          WHERE id = ?
        `,
        [before, after, item.id],
      );

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
            reason_code,
            note,
            performed_by,
            approved_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'STOCK_ADJUSTMENT', ?, ?, ?, ?, ?)
        `,
        [
          buildUniqueCode('ADJUST', adjustment.adjustment_code),
          transactionType,
          adjustment.warehouse_id,
          item.product_variant_id,
          item.batch_id,
          item.adjustment_direction === 'OUT' ? item.location_id : null,
          item.adjustment_direction === 'IN' ? item.location_id : null,
          item.quantity,
          before,
          after,
          adjustment.id,
          item.reason_code,
          item.note,
          input.approvedBy,
          input.approvedBy,
        ],
      );

      transactionCount += 1;
    }

    await insertAuditLog(connection, {
      userId: input.approvedBy,
      action: 'APPROVE',
      module: 'stock_adjustments',
      entityType: 'STOCK_ADJUSTMENT',
      entityId: adjustment.id,
      oldValues: { status: adjustment.status },
      newValues: { status: 'APPROVED', transactionCount },
    });

    await connection.query(
      `
        UPDATE stock_adjustments
        SET
          status = 'APPROVED',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.approvedBy, adjustment.id],
    );

    await connection.commit();

    return {
      adjustmentId: adjustment.id,
      adjustmentCode: adjustment.adjustment_code,
      status: 'APPROVED',
      transactionCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function rejectStockAdjustmentTransaction(
  input: RejectStockAdjustmentInput,
): Promise<RejectStockAdjustmentResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const adjustment = await lockAdjustment(connection, input.adjustmentId);

    if (!adjustment) {
      throw new Error('STOCK_ADJUSTMENT_NOT_FOUND');
    }

    if (adjustment.status === 'REJECTED') {
      await connection.commit();
      return {
        adjustmentId: adjustment.id,
        adjustmentCode: adjustment.adjustment_code,
        status: 'REJECTED',
      };
    }

    if (!['DRAFT', 'PENDING'].includes(adjustment.status)) {
      throw new Error('STOCK_ADJUSTMENT_NOT_REJECTABLE');
    }

    await connection.query(
      `
        UPDATE stock_adjustments
        SET
          status = 'REJECTED',
          rejected_by = ?,
          rejected_at = CURRENT_TIMESTAMP(3),
          rejection_reason = ?
        WHERE id = ?
      `,
      [input.rejectedBy, input.rejectionReason, adjustment.id],
    );

    await insertAuditLog(connection, {
      userId: input.rejectedBy,
      action: 'REJECT',
      module: 'stock_adjustments',
      entityType: 'STOCK_ADJUSTMENT',
      entityId: adjustment.id,
      oldValues: { status: adjustment.status },
      newValues: {
        status: 'REJECTED',
        rejectionReason: input.rejectionReason,
      },
    });

    await connection.commit();

    return {
      adjustmentId: adjustment.id,
      adjustmentCode: adjustment.adjustment_code,
      status: 'REJECTED',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function cancelStockAdjustmentTransaction(
  input: CancelStockAdjustmentInput,
): Promise<CancelStockAdjustmentResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const adjustment = await lockAdjustment(connection, input.adjustmentId);

    if (!adjustment) {
      throw new Error('STOCK_ADJUSTMENT_NOT_FOUND');
    }

    if (adjustment.status === 'CANCELLED') {
      await connection.commit();
      return {
        adjustmentId: adjustment.id,
        adjustmentCode: adjustment.adjustment_code,
        status: 'CANCELLED',
      };
    }

    if (!['DRAFT', 'PENDING'].includes(adjustment.status)) {
      throw new Error('STOCK_ADJUSTMENT_NOT_CANCELLABLE');
    }

    await connection.query(
      `
        UPDATE stock_adjustments
        SET status = 'CANCELLED'
        WHERE id = ?
      `,
      [adjustment.id],
    );

    await insertAuditLog(connection, {
      userId: input.cancelledBy,
      action: 'CANCEL',
      module: 'stock_adjustments',
      entityType: 'STOCK_ADJUSTMENT',
      entityId: adjustment.id,
      oldValues: { status: adjustment.status },
      newValues: { status: 'CANCELLED' },
    });

    await connection.commit();

    return {
      adjustmentId: adjustment.id,
      adjustmentCode: adjustment.adjustment_code,
      status: 'CANCELLED',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function insertStockAdjustment(
  input: CreateStockAdjustmentInput,
): Promise<{ id: number }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    let targetWarehouseId = input.warehouseId;
    if (!targetWarehouseId && input.items && input.items.length > 0) {
      const firstLocationId = input.items[0].locationId;
      const [inferredWarehouse] = await connection.query<
        Array<RowDataPacket & { warehouse_id: number }>
      >(
        `SELECT wz.warehouse_id
         FROM warehouse_locations wl
         JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
         JOIN warehouse_zones wz ON wz.id = ws.zone_id
         WHERE wl.id = ? LIMIT 1`,
        [firstLocationId],
      );
      if (inferredWarehouse[0]?.warehouse_id) {
        targetWarehouseId = inferredWarehouse[0].warehouse_id;
      }
    }

    const [warehouseRows] = targetWarehouseId
      ? await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM warehouses WHERE id = ? LIMIT 1',
          [targetWarehouseId],
        )
      : await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM warehouses WHERE code = ? LIMIT 1',
          ['KHO-HCM-01'],
        );
    const [userRows] = input.createdBy
      ? await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM users WHERE id = ? LIMIT 1',
          [input.createdBy],
        )
      : await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM users WHERE employee_code = ? LIMIT 1',
          ['NV-KHO-01'],
        );
    const adjustmentCode =
      input.adjustmentCode ??
      (await generateDocumentCode(
        connection,
        'stock_adjustments',
        'adjustment_code',
        'DC',
      ));

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO stock_adjustments (adjustment_code, warehouse_id, adjustment_type, status, reason_code, note, created_by)
       VALUES (?, ?, 'MANUAL', 'DRAFT', ?, ?, ?)`,
      [
        adjustmentCode,
        warehouseRows[0]?.id,
        input.reasonCode ?? 'DIEU_CHINH_THU_CONG',
        input.note ?? null,
        userRows[0]?.id,
      ],
    );

    for (const item of input.items ?? []) {
      await connection.query(
        `INSERT INTO stock_adjustment_items (stock_adjustment_id, product_variant_id, batch_id, location_id, adjustment_direction, quantity, reason_code, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.insertId,
          item.productVariantId,
          item.batchId ?? null,
          item.locationId,
          item.adjustmentDirection,
          item.quantity,
          item.reasonCode ?? input.reasonCode ?? 'DIEU_CHINH_THU_CONG',
          item.note ?? null,
        ],
      );
    }

    await connection.commit();
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
