import type { BatchesFilters, BatchesRow } from './batches.model';
import { findBatches as findBatchesRepository } from './batches.repository';

export async function listBatches(
  filters: BatchesFilters,
): Promise<BatchesRow[]> {
  return findBatchesRepository(filters);
}
