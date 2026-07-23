import { HttpError } from '../../common/http';
import type {
  WarehouseInput,
  WarehouseMutationResult,
  WarehousesFilters,
  WarehousesRow,
} from './warehouses.model';
import {
  createWarehouseRepository,
  deleteWarehouseRepository,
  findWarehouses as findWarehousesRepository,
  updateWarehouseRepository,
} from './warehouses.repository';

export async function listWarehouses(
  filters: WarehousesFilters,
): Promise<WarehousesRow[]> {
  return findWarehousesRepository(filters);
}

export async function createWarehouse(
  input: WarehouseInput,
): Promise<WarehouseMutationResult> {
  return createWarehouseRepository(input);
}

export async function updateWarehouse(
  id: number,
  input: WarehouseInput,
): Promise<WarehouseMutationResult> {
  const affectedRows = await updateWarehouseRepository(id, input);

  if (affectedRows === 0) {
    throw new HttpError(404, 'Warehouse not found', 'WAREHOUSE_NOT_FOUND');
  }

  return { affectedRows };
}

export async function deleteWarehouse(
  id: number,
): Promise<WarehouseMutationResult> {
  const affectedRows = await deleteWarehouseRepository(id);

  if (affectedRows === 0) {
    throw new HttpError(404, 'Warehouse not found', 'WAREHOUSE_NOT_FOUND');
  }

  return { affectedRows };
}
