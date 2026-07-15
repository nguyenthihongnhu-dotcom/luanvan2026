import type {
  InventoryTransactionsFilters,
  InventoryTransactionsRow,
} from './inventory-transactions.model';
import { findInventoryTransactions as findInventoryTransactionsRepository } from './inventory-transactions.repository';

export async function listInventoryTransactions(
  filters: InventoryTransactionsFilters,
): Promise<InventoryTransactionsRow[]> {
  return findInventoryTransactionsRepository(filters);
}
