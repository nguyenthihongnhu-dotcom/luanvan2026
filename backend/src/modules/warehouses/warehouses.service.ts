import type { WarehousesFilters, WarehousesRow } from './warehouses.model';
import { findWarehouses as findWarehousesRepository } from './warehouses.repository';

export async function listWarehouses(
  filters: WarehousesFilters,
): Promise<WarehousesRow[]> {
  return findWarehousesRepository(filters);
}
