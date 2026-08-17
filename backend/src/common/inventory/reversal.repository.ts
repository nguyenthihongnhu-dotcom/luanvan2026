import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { buildUniqueCode } from '../code/code-generator';

type InventoryTransactionRow = RowDataPacket & {
  id: number;
  transaction_code: string;
  transaction_type: string;
  warehouse_id: number;
  product_variant_id: number;
  batch_id: number | null;
  source_location_id: number | null;
  destination_location_id: number | null;
  quantity: number;
};

type StockLocationRow = RowDataPacket & {
  id: number;
  quantity: number;
};

export type ReverseInventoryReferenceInput = {
  referenceType: string;
  referenceId: number;
  reversedBy: number;
  note: string;
};

function reversalLocationId(transaction: InventoryTransactionRow): number {
  if (
    [
      'RECEIPT',
      'TRANSFER_IN',
      'COUNT_ADJUSTMENT_IN',
      'MANUAL_ADJUSTMENT_IN',
      'RETURN_IN',
    ].includes(transaction.transaction_type)
  ) {
    if (!transaction.destination_location_id) {
      throw new Error('REVERSAL_LOCATION_NOT_FOUND');
    }

    return transaction.destination_location_id;
  }

  if (
    [
      'ISSUE',
      'TRANSFER_OUT',
      'COUNT_ADJUSTMENT_OUT',
      'MANUAL_ADJUSTMENT_OUT',
      'RETURN_OUT',
    ].includes(transaction.transaction_type)
  ) {
    if (!transaction.source_location_id) {
      throw new Error('REVERSAL_LOCATION_NOT_FOUND');
    }

    return transaction.source_location_id;
  }

  throw new Error('TRANSACTION_NOT_REVERSIBLE');
}

function reversalAddsStock(transactionType: string): boolean {
  return [
    'ISSUE',
    'TRANSFER_OUT',
    'COUNT_ADJUSTMENT_OUT',
    'MANUAL_ADJUSTMENT_OUT',
    'RETURN_OUT',
  ].includes(transactionType);
}

async function lockOriginalTransactions(
  connection: PoolConnection,
  input: ReverseInventoryReferenceInput,
): Promise<InventoryTransactionRow[]> {
  const [rows] = await connection.query<InventoryTransactionRow[]>(
    `
      SELECT
        id,
        transaction_code,
        transaction_type,
        warehouse_id,
        product_variant_id,
        batch_id,
        source_location_id,
        destination_location_id,
        quantity
      FROM inventory_transactions
      WHERE reference_type = ?
        AND reference_id = ?
        AND transaction_type <> 'REVERSAL'
      ORDER BY id DESC
      FOR UPDATE
    `,
    [input.referenceType, input.referenceId],
  );

  return rows;
}

async function assertNotReversed(
  connection: PoolConnection,
  transactionIds: number[],
): Promise<void> {
  if (transactionIds.length === 0) {
    return;
  }

  const placeholders = transactionIds.map(() => '?').join(', ');
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT id
      FROM inventory_transactions
      WHERE reversal_of_transaction_id IN (${placeholders})
      LIMIT 1
      FOR UPDATE
    `,
    transactionIds,
  );

  if (rows.length > 0) {
    throw new Error('REFERENCE_ALREADY_REVERSED');
  }
}

async function lockStockLocation(
  connection: PoolConnection,
  transaction: InventoryTransactionRow,
  locationId: number,
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
    [transaction.product_variant_id, locationId, transaction.batch_id],
  );

  return rows[0];
}

async function ensureStockLocation(
  connection: PoolConnection,
  transaction: InventoryTransactionRow,
  locationId: number,
): Promise<StockLocationRow> {
  const existing = await lockStockLocation(connection, transaction, locationId);

  if (existing) {
    return existing;
  }

  const [insertResult] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO stock_locations (product_variant_id, location_id, batch_id, quantity)
      VALUES (?, ?, ?, 0)
    `,
    [transaction.product_variant_id, locationId, transaction.batch_id],
  );

  return { id: insertResult.insertId, quantity: 0 } as StockLocationRow;
}

export async function reverseInventoryReference(
  connection: PoolConnection,
  input: ReverseInventoryReferenceInput,
): Promise<number> {
  const originals = await lockOriginalTransactions(connection, input);

  if (originals.length === 0) {
    throw new Error('REFERENCE_HAS_NO_TRANSACTIONS');
  }

  await assertNotReversed(
    connection,
    originals.map((transaction) => transaction.id),
  );

  let reversalCount = 0;

  for (const transaction of originals) {
    const locationId = reversalLocationId(transaction);
    const addsStock = reversalAddsStock(transaction.transaction_type);
    const stockLocation = addsStock
      ? await ensureStockLocation(connection, transaction, locationId)
      : await lockStockLocation(connection, transaction, locationId);

    if (!stockLocation) {
      throw new Error('REVERSAL_STOCK_NOT_FOUND');
    }

    const before = Number(stockLocation.quantity);
    const quantity = Number(transaction.quantity);
    const after = addsStock ? before + quantity : before - quantity;

    if (after < 0) {
      throw new Error('REVERSAL_INSUFFICIENT_STOCK');
    }

    // Rút hàng khỏi ô có thể kéo tồn xuống dưới phần đang giữ chỗ (phiếu chuyển
    // được phép dời cả hàng giữ chỗ sang ô mới). Kẹp lại để không vỡ ràng buộc
    // chk_stock_available (reserved_quantity <= quantity) của bảng.
    const [updateResult] = await connection.query<ResultSetHeader>(
      `
        UPDATE stock_locations
        SET quantity = ?,
            reserved_quantity = LEAST(reserved_quantity, ?),
            version = version + 1
        WHERE id = ?
          AND ? >= 0
      `,
      [after, after, stockLocation.id, after],
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error('CONCURRENT_STOCK_UPDATE');
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
          reversal_of_transaction_id,
          note,
          performed_by,
          approved_by
        )
        VALUES (?, 'REVERSAL', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        buildUniqueCode('REVERSAL', transaction.transaction_code),
        transaction.warehouse_id,
        transaction.product_variant_id,
        transaction.batch_id,
        addsStock ? null : locationId,
        addsStock ? locationId : null,
        quantity,
        before,
        after,
        input.referenceType,
        input.referenceId,
        transaction.id,
        input.note,
        input.reversedBy,
        input.reversedBy,
      ],
    );

    reversalCount += 1;
  }

  return reversalCount;
}
