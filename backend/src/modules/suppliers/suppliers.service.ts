import type {
  MutationResult,
  SupplierInput,
  SuppliersFilters,
  SuppliersRow,
} from './suppliers.model';
import {
  findSuppliers as findSuppliersRepository,
  insertSupplier,
  softDeleteSupplier,
  updateSupplier as updateSupplierRepository,
} from './suppliers.repository';

export async function listSuppliers(
  filters: SuppliersFilters,
): Promise<SuppliersRow[]> {
  return findSuppliersRepository(filters);
}

export function createSupplier(input: SupplierInput): Promise<{ id: number }> {
  return insertSupplier(input);
}

export function updateSupplier(
  id: number,
  input: SupplierInput,
): MutationResult {
  return updateSupplierRepository(id, input);
}

export function deleteSupplier(id: number): MutationResult {
  return softDeleteSupplier(id);
}
