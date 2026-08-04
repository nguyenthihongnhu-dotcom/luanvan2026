import { db } from '../../database/db';
import type {
  InventoryTransactionsFilters,
  InventoryTransactionsRow,
  QueryParams,
} from './inventory-transactions.model';

const tableName = 'inventory_transactions';

export async function findInventoryTransactions(
  filters: InventoryTransactionsFilters,
): Promise<InventoryTransactionsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('it.id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(' +
        'it.transaction_code LIKE :search OR it.transaction_type LIKE :search OR ' +
        'it.reference_type LIKE :search OR it.reason_code LIKE :search OR ' +
        'pv.sku LIKE :search OR p.name LIKE :search OR w.name LIKE :search OR ' +
        'u.full_name LIKE :search' +
        ')',
    );
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<InventoryTransactionsRow[]>({
    sql: `
      SELECT
        it.*,
        w.code AS warehouse_code,
        w.name AS warehouse_name,
        pv.sku,
        p.name AS product_name,
        pv.variant_name,
        src_loc.code AS source_location_code,
        dst_loc.code AS destination_location_code,
        u.full_name AS performed_by_name
      FROM inventory_transactions it
      LEFT JOIN warehouses w ON w.id = it.warehouse_id
      LEFT JOIN product_variants pv ON pv.id = it.product_variant_id
      LEFT JOIN products p ON p.id = pv.product_id
      LEFT JOIN warehouse_locations src_loc ON src_loc.id = it.source_location_id
      LEFT JOIN warehouse_locations dst_loc ON dst_loc.id = it.destination_location_id
      LEFT JOIN users u ON u.id = it.performed_by
      ${whereSql}
      ORDER BY it.created_at DESC, it.id DESC
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}
