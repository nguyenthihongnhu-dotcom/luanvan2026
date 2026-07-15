import type { StockCountsFilters, StockCountsRow } from './stock-counts.model';
import { findStockCounts as findStockCountsRepository } from './stock-counts.repository';

export async function listStockCounts(
  filters: StockCountsFilters,
): Promise<StockCountsRow[]> {
  return findStockCountsRepository(filters);
}
