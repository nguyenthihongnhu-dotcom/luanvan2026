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
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('transaction_code LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<InventoryTransactionsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
