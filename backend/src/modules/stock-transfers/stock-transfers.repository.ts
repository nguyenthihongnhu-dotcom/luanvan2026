import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { insertAuditLog } from '../../common/audit/audit.repository';
import { buildUniqueCode } from '../../common/code/code-generator';
import { reverseInventoryReference } from '../../common/inventory/reversal.repository';
import {
  UNRESTRICTED_SCOPE,
  warehouseScopeWhere,
} from '../../common/access/warehouse-scope';
import { db } from '../../database/db';
import type {
  ConfirmStockTransferInput,
  ConfirmStockTransferResult,
  CreateStockTransferInput,
  CreateStockTransferResult,
  ReverseStockTransferInput,
  ReverseStockTransferResult,
  QueryParams,
  StockTransferItemRow,
  StockTransferRow,
  StockTransfersFilters,
  StockTransfersRow,
} from './stock-transfers.model';

const tableName = 'stock_transfers';

type StockLocationRow = RowDataPacket & {
  id: number;
  quantity: number;
  reserved_quantity: number;
};

export async function findStockTransfers(
  filters: StockTransfersFilters,
): Promise<StockTransfersRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('transfer_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  // Phiếu chuyển dính tới hai kho, chỉ cần một đầu nằm trong phạm vi là người dùng
  // phải thấy: bên gửi cần theo dõi hàng đi, bên nhận cần biết hàng sắp tới.
  const scope = filters.warehouseScope ?? UNRESTRICTED_SCOPE;
  const sourceWhere = warehouseScopeWhere(
    scope,
    'source_warehouse_id',
    params,
    {
      paramPrefix: 'scopeSource',
    },
  );
  const destinationWhere = warehouseScopeWhere(
    scope,
    'destination_warehouse_id',
    params,
    { paramPrefix: 'scopeDestination' },
  );
  if (sourceWhere && destinationWhere) {
    where.push(`(${sourceWhere} OR ${destinationWhere})`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<StockTransfersRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}

async function lockTransfer(
  connection: PoolConnection,
  transferId: number,
): Promise<StockTransferRow | undefined> {
  const [rows] = await connection.query<StockTransferRow[]>(
    `
      SELECT id, transfer_code, source_warehouse_id, destination_warehouse_id, status
      FROM stock_transfers
      WHERE id = ?
      FOR UPDATE
    `,
    [transferId],
  );

  return rows[0];
}

async function lockTransferItems(
  connection: PoolConnection,
  transferId: number,
): Promise<StockTransferItemRow[]> {
  const [rows] = await connection.query<StockTransferItemRow[]>(
    `
      SELECT
        id,
        stock_transfer_id,
        product_variant_id,
        batch_id,
        source_location_id,
        destination_location_id,
        quantity,
        note
      FROM stock_transfer_items
      WHERE stock_transfer_id = ?
      ORDER BY id
      FOR UPDATE
    `,
    [transferId],
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

async function addDestinationStock(
  connection: PoolConnection,
  productVariantId: number,
  locationId: number,
  batchId: number | null,
  quantity: number,
  // Phần giữ chỗ dời theo hàng: đơn đặt trước vẫn được giữ đúng số lượng, chỉ là
  // hàng nằm ở ô khác.
  reservedQuantity = 0,
): Promise<{ stockLocationId: number; before: number; after: number }> {
  const existing = await lockStockLocation(
    connection,
    productVariantId,
    locationId,
    batchId,
  );
  const before = existing ? Number(existing.quantity) : 0;
  const after = before + quantity;

  if (existing) {
    await connection.query(
      `
        UPDATE stock_locations
        SET quantity = quantity + ?,
            reserved_quantity = reserved_quantity + ?,
            version = version + 1
        WHERE id = ?
      `,
      [quantity, reservedQuantity, existing.id],
    );

    return { stockLocationId: existing.id, before, after };
  }

  const [insertResult] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO stock_locations (
        product_variant_id,
        location_id,
        batch_id,
        quantity,
        reserved_quantity
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [productVariantId, locationId, batchId, quantity, reservedQuantity],
  );

  return { stockLocationId: insertResult.insertId, before, after };
}

export async function confirmStockTransferTransaction(
  input: ConfirmStockTransferInput,
): Promise<ConfirmStockTransferResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const transfer = await lockTransfer(connection, input.transferId);

    if (!transfer) {
      throw new Error('STOCK_TRANSFER_NOT_FOUND');
    }

    if (transfer.status === 'CONFIRMED') {
      const [transactionRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id
          FROM inventory_transactions
          WHERE reference_type = 'STOCK_TRANSFER'
            AND reference_id = ?
        `,
        [transfer.id],
      );
      await connection.commit();

      return {
        transferId: transfer.id,
        transferCode: transfer.transfer_code,
        status: 'CONFIRMED',
        transactionCount: transactionRows.length,
      };
    }

    if (!['DRAFT', 'PENDING'].includes(transfer.status)) {
      throw new Error('STOCK_TRANSFER_NOT_CONFIRMABLE');
    }

    const items = await lockTransferItems(connection, transfer.id);

    if (items.length === 0) {
      throw new Error('STOCK_TRANSFER_HAS_NO_ITEMS');
    }

    let transactionCount = 0;

    for (const item of items) {
      await assertLocationInWarehouse(
        connection,
        item.source_location_id,
        transfer.source_warehouse_id,
      );
      await assertLocationInWarehouse(
        connection,
        item.destination_location_id,
        transfer.destination_warehouse_id,
      );

      const source = await lockStockLocation(
        connection,
        item.product_variant_id,
        item.source_location_id,
        item.batch_id,
      );

      if (!source) {
        throw new Error('SOURCE_STOCK_NOT_FOUND');
      }

      const quantityBeforeOut = Number(source.quantity);
      const movedQuantity = Number(item.quantity);
      const quantityAfterOut = quantityBeforeOut - movedQuantity;

      // Chuyển kho chỉ đổi chỗ chứ không tiêu thụ hàng, nên hàng đang giữ chỗ cho
      // đơn đặt trước vẫn được phép đi: chuyển quá phần khả dụng thì phần dôi ra
      // chính là giữ chỗ dời sang ô đích. Trần vẫn là tồn vật lý của ô nguồn, và
      // ràng buộc chk_stock_available (reserved <= quantity) không bị vỡ ở cả hai đầu.
      const availableAtSource =
        quantityBeforeOut - Number(source.reserved_quantity);
      const movedReserved = Math.max(0, movedQuantity - availableAtSource);

      const [deductResult] = await connection.query<ResultSetHeader>(
        `
          UPDATE stock_locations
          SET quantity = quantity - ?,
              reserved_quantity = reserved_quantity - ?,
              version = version + 1
          WHERE id = ?
            AND quantity >= ?
        `,
        [movedQuantity, movedReserved, source.id, movedQuantity],
      );

      if (deductResult.affectedRows !== 1) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const destination = await addDestinationStock(
        connection,
        item.product_variant_id,
        item.destination_location_id,
        item.batch_id,
        movedQuantity,
        movedReserved,
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
            note,
            performed_by,
            approved_by
          )
          VALUES (?, 'TRANSFER_OUT', ?, ?, ?, ?, ?, ?, ?, ?, 'STOCK_TRANSFER', ?, ?, ?, ?)
        `,
        [
          buildUniqueCode('TRANSFEROUT', transfer.transfer_code),
          transfer.source_warehouse_id,
          item.product_variant_id,
          item.batch_id,
          item.source_location_id,
          item.destination_location_id,
          item.quantity,
          quantityBeforeOut,
          quantityAfterOut,
          transfer.id,
          `Confirmed stock transfer ${transfer.transfer_code}`,
          input.confirmedBy,
          input.confirmedBy,
        ],
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
            note,
            performed_by,
            approved_by
          )
          VALUES (?, 'TRANSFER_IN', ?, ?, ?, ?, ?, ?, ?, ?, 'STOCK_TRANSFER', ?, ?, ?, ?)
        `,
        [
          buildUniqueCode('TRANSFERIN', transfer.transfer_code),
          transfer.destination_warehouse_id,
          item.product_variant_id,
          item.batch_id,
          item.source_location_id,
          item.destination_location_id,
          item.quantity,
          destination.before,
          destination.after,
          transfer.id,
          `Confirmed stock transfer ${transfer.transfer_code}`,
          input.confirmedBy,
          input.confirmedBy,
        ],
      );

      transactionCount += 2;
    }

    await insertAuditLog(connection, {
      userId: input.confirmedBy,
      action: 'CONFIRM',
      module: 'stock_transfers',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.id,
      oldValues: { status: transfer.status },
      newValues: { status: 'CONFIRMED', transactionCount },
    });

    await connection.query(
      `
        UPDATE stock_transfers
        SET
          status = 'CONFIRMED',
          confirmed_by = ?,
          confirmed_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.confirmedBy, transfer.id],
    );

    await connection.commit();

    return {
      transferId: transfer.id,
      transferCode: transfer.transfer_code,
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

export async function reverseStockTransferTransaction(
  input: ReverseStockTransferInput,
): Promise<ReverseStockTransferResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const transfer = await lockTransfer(connection, input.transferId);

    if (!transfer) {
      throw new Error('STOCK_TRANSFER_NOT_FOUND');
    }

    if (transfer.status === 'CANCELLED') {
      await connection.commit();
      return {
        transferId: transfer.id,
        transferCode: transfer.transfer_code,
        status: 'CANCELLED',
        reversalCount: 0,
      };
    }

    if (transfer.status !== 'CONFIRMED') {
      throw new Error('STOCK_TRANSFER_NOT_REVERSIBLE');
    }

    const reversalCount = await reverseInventoryReference(connection, {
      referenceType: 'STOCK_TRANSFER',
      referenceId: transfer.id,
      reversedBy: input.reversedBy,
      note: `Reversed stock transfer ${transfer.transfer_code}`,
    });

    await insertAuditLog(connection, {
      userId: input.reversedBy,
      action: 'REVERSE',
      module: 'stock_transfers',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.id,
      oldValues: { status: transfer.status },
      newValues: { status: 'CANCELLED', reversalCount },
    });

    await connection.query(
      `
        UPDATE stock_transfers
        SET status = 'CANCELLED', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `,
      [input.reversedBy, transfer.id],
    );

    await connection.commit();

    return {
      transferId: transfer.id,
      transferCode: transfer.transfer_code,
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

export async function insertStockTransfer(
  input: CreateStockTransferInput,
): Promise<CreateStockTransferResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [warehouseRows] = input.sourceWarehouseId
      ? await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM warehouses WHERE id = ? LIMIT 1',
          [input.sourceWarehouseId],
        )
      : await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM warehouses WHERE code = ? LIMIT 1',
          ['KHO-HCM-01'],
        );
    const sourceWarehouseId = warehouseRows[0]?.id;
    const destinationWarehouseId =
      input.destinationWarehouseId ?? sourceWarehouseId;

    if (!sourceWarehouseId || !destinationWarehouseId) {
      throw new Error('WAREHOUSE_NOT_FOUND');
    }

    const [userRows] = input.createdBy
      ? await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM users WHERE id = ? LIMIT 1',
          [input.createdBy],
        )
      : await connection.query<Array<RowDataPacket & { id: number }>>(
          'SELECT id FROM users WHERE employee_code = ? LIMIT 1',
          ['NV-KHO-01'],
        );
    const createdBy = userRows[0]?.id;

    if (!createdBy) {
      throw new Error('USER_NOT_FOUND');
    }

    const transferCode =
      input.transferCode ?? buildUniqueCode('TRF', String(Date.now()));
    const [transferResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO stock_transfers (
          transfer_code,
          source_warehouse_id,
          destination_warehouse_id,
          status,
          note,
          created_by
        )
        VALUES (?, ?, ?, 'DRAFT', ?, ?)
      `,
      [
        transferCode,
        sourceWarehouseId,
        destinationWarehouseId,
        input.note ?? null,
        createdBy,
      ],
    );

    for (const item of input.items) {
      if (item.sourceLocationId === item.destinationLocationId) {
        throw new Error('TRANSFER_SAME_LOCATION');
      }

      await connection.query(
        `
          INSERT INTO stock_transfer_items (
            stock_transfer_id,
            product_variant_id,
            batch_id,
            source_location_id,
            destination_location_id,
            quantity,
            note
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          transferResult.insertId,
          item.productVariantId,
          item.batchId ?? null,
          item.sourceLocationId,
          item.destinationLocationId,
          item.quantity,
          item.note ?? null,
        ],
      );
    }

    await insertAuditLog(connection, {
      userId: createdBy,
      action: 'CREATE',
      module: 'stock_transfers',
      entityType: 'STOCK_TRANSFER',
      entityId: transferResult.insertId,
      newValues: { transferCode, itemCount: input.items.length },
    });

    await connection.commit();

    return {
      id: transferResult.insertId,
      transferCode,
      itemCount: input.items.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
