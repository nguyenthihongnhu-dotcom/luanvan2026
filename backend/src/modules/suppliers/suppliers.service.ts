import type { SuppliersFilters, SuppliersRow } from './suppliers.model';
import { findSuppliers as findSuppliersRepository } from './suppliers.repository';

export async function listSuppliers(
  filters: SuppliersFilters,
): Promise<SuppliersRow[]> {
  return findSuppliersRepository(filters);
}
