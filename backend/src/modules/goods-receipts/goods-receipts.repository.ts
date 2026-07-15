import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { insertAuditLog } from '../../common/audit/audit.repository';
import { buildUniqueCode } from '../../common/code/code-generator';
import { db } from '../../database/db';
import type {
  ConfirmGoodsReceiptInput,
  ConfirmGoodsReceiptResult,
  GoodsReceiptItemRow,
  GoodsReceiptRow,
  GoodsReceiptsFilters,
  GoodsReceiptsRow,
  QueryParams,
} from './goods-receipts.model';

const tableName = 'goods_receipts';

type StockLocationRow = RowDataPacket & {
  id: number;
  quantity: number;
};

export async function findGoodsReceipts(
  filters: GoodsReceiptsFilters,
): Promise<GoodsReceiptsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('receipt_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<GoodsReceiptsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}

async function lockReceipt(
  connection: PoolConnection,
  receiptId: number,
): Promise<GoodsReceiptRow | undefined> {
  const [rows] = await connection.query<GoodsReceiptRow[]>(
    `
      SELECT id, receipt_code, warehouse_id, status
      FROM goods_receipts
      WHERE id = ?
      FOR UPDATE
    `,
    [receiptId],
  );

  return rows[0];
}

async function lockReceiptItems(
  connection: PoolConnection,
  receiptId: number,
): Promise<GoodsReceiptItemRow[]> {
  const [rows] = await connection.query<GoodsReceiptItemRow[]>(
    `
      SELECT
        gri.id,
        gri.goods_receipt_id,
        gri.product_variant_id,
        gri.batch_id,
        gri.location_id,
        gri.quantity,
        gri.note,
        pv.requires_lot_tracking,
        pv.requires_expiry_tracking,
        pb.expiry_date
      FROM goods_receipt_items gri
      JOIN product_variants pv ON pv.id = gri.product_variant_id
      LEFT JOIN product_batches pb ON pb.id = gri.batch_id
      WHERE gri.goods_receipt_id = ?
      ORDER BY gri.id
      FOR UPDATE
    `,
    [receiptId],
  );

  return rows;
}

async function lockStockLocation(
  connection: PoolConnection,
  productVariantId: number,
  locationId: number,
  batchId: number | null,
): Promise<StockLocationRow | undefined> {
  const [rows] = await connection.query<StockLocationRow[]>(
    `
      SELECT id, quantity
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

export async function confirmGoodsReceiptTransaction(
  input: ConfirmGoodsReceiptInput,
): Promise<ConfirmGoodsReceiptResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const receipt = await lockReceipt(connection, input.receiptId);

    if (!receipt) {
      throw new Error('GOODS_RECEIPT_NOT_FOUND');
    }

    if (receipt.status === 'CONFIRMED') {
      const [transactionRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id
          FROM inventory_transactions
          WHERE reference_type = 'GOODS_RECEIPT'
            AND reference_id = ?
        `,
        [receipt.id],
      );
      await connection.commit();

      return {
        receiptId: receipt.id,
        receiptCode: receipt.receipt_code,
        status: 'CONFIRMED',
        transactionCount: transactionRows.length,
      };
    }

    if (!['DRAFT', 'PENDING'].includes(receipt.status)) {
      throw new Error('GOODS_RECEIPT_NOT_CONFIRMABLE');
    }

    const items = await lockReceiptItems(connection, receipt.id);

    if (items.length === 0) {
      throw new Error('GOODS_RECEIPT_HAS_NO_ITEMS');
    }

    let transactionCount = 0;

    for (const item of items) {
      if (item.requires_lot_tracking === 1 && !item.batch_id) {
        throw new Error('BATCH_REQUIRED');
      }

      if (item.requires_expiry_tracking === 1 && !item.expiry_date) {
        throw new Error('EXPIRY_DATE_REQUIRED');
      }

      await assertLocationInWarehouse(
        connection,
        item.location_id,
        receipt.warehouse_id,
      );

      const stockLocation = await lockStockLocation(
        connection,
        item.product_variant_id,
        item.location_id,
        item.batch_id,
      );
      const quantityBefore = stockLocation ? Number(stockLocation.quantity) : 0;
      const quantityAfter = quantityBefore + Number(item.quantity);
      let stockLocationId: number;

      if (stockLocation) {
        stockLocationId = stockLocation.id;
        await connection.query<ResultSetHeader>(
          `
            UPDATE stock_locations
            SET quantity = quantity + ?, version = version + 1
            WHERE id = ?
          `,
          [item.quantity, stockLocation.id],
        );
      } else {
        const [insertResult] = await connection.query<ResultSetHeader>(
          `
            INSERT INTO stock_locations (
              product_variant_id,
              location_id,
              batch_id,
              quantity
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            item.product_variant_id,
            item.location_id,
            item.batch_id,
            item.quantity,
          ],
        );
        stockLocationId = insertResult.insertId;
      }

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
          VALUES (?, 'RECEIPT', ?, ?, ?, NULL, ?, ?, ?, ?, 'GOODS_RECEIPT', ?, ?, ?, ?)
        `,
        [
          buildUniqueCode('RECEIPT', receipt.receipt_code),
          receipt.warehouse_id,
          item.product_variant_id,
          item.batch_id,
          item.location_id,
          item.quantity,
          quantityBefore,
          quantityAfter,
          receipt.id,
          `Confirmed goods receipt ${receipt.receipt_code}`,
          input.confirmedBy,
          input.confirmedBy,
        ],
      );

      void stockLocationId;
      transactionCount += 1;
    }

    await insertAuditLog(connection, {
      userId: input.confirmedBy,
      action: 'CONFIRM',
      module: 'goods_receipts',
      entityType: 'GOODS_RECEIPT',
      entityId: receipt.id,
      oldValues: { status: receipt.status },
      newValues: { status: 'CONFIRMED', transactionCount },
    });

    await connection.query(
      `
        UPDATE goods_receipts
        SET
          status = 'CONFIRMED',
          confirmed_by = ?,
          confirmed_at = CURRENT_TIMESTAMP(3),
          received_at = COALESCE(received_at, CURRENT_TIMESTAMP(3))
        WHERE id = ?
      `,
      [input.confirmedBy, receipt.id],
    );

    await connection.commit();

    return {
      receiptId: receipt.id,
      receiptCode: receipt.receipt_code,
      status: 'CONFIRMED',
      transactionCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
