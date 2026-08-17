import type { Request, Response } from 'express';
import {
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
import { HttpError } from '../../common/http';
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
} from './warehouses.service';
import {
  parseWarehouseInput,
  parseWarehousesFilters,
} from './warehouses.validation';

function parseId(value: unknown): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid warehouse id', 'INVALID_WAREHOUSE_ID');
  }

  return id;
}

export async function listWarehousesController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseWarehousesFilters(req.query);
  // Vẫn trả đủ danh sách vì nhiều màn dùng nó để đổi id thành tên kho (kể cả kho
  // trên phiếu cũ); cắt bớt ở đây sẽ làm phiếu hiện "Kho #2". Thay vào đó đánh
  // dấu kho người dùng được phụ trách để phía giao diện chỉ cho chọn những kho đó.
  const warehouseScope = await resolveWarehouseScope(req.user);
  const warehouses = await listWarehouses(filters);

  res.json({
    data: warehouses.map((warehouse) => ({
      ...warehouse,
      in_scope: isWarehouseInScope(warehouseScope, Number(warehouse.id)),
    })),
  });
}

export async function createWarehouseController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseWarehouseInput(req.body);

  res.status(201).json({ data: await createWarehouse(input) });
}

export async function updateWarehouseController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseId(req.params.id);
  const input = parseWarehouseInput(req.body);

  res.json({ data: await updateWarehouse(id, input) });
}

export async function deleteWarehouseController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseId(req.params.id);

  res.json({ data: await deleteWarehouse(id) });
}
