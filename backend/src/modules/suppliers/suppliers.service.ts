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

export async function createSupplier(
  input: SupplierInput,
): Promise<{ id: number }> {
  return insertSupplier(input);
}

export async function updateSupplier(
  id: number,
  input: SupplierInput,
): Promise<MutationResult> {
  return updateSupplierRepository(id, input);
}

export async function deleteSupplier(id: number): Promise<MutationResult> {
  return softDeleteSupplier(id);
}
