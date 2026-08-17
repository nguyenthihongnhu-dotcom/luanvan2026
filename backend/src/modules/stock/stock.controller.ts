import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
import {
  listCurrentStock,
  listNearExpiryStock,
  previewStockAllocation,
  quickReceiveStock,
} from './stock.service';
import {
  parseNearExpiryFilters,
  parseStockAllocationInput,
  parseStockFilters,
  parseQuickReceiveInput,
} from './stock.validation';

export async function listCurrentStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listCurrentStock({ ...filters, warehouseScope }) });
}

export async function listNearExpiryStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseNearExpiryFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listNearExpiryStock({ ...filters, warehouseScope }) });
}

export async function previewStockAllocationController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseStockAllocationInput(req.query);
  // Xem trước phân bổ trả về mã ô, lô và số lượng của kho được hỏi, nên cũng phải
  // chặn theo kho như mọi dữ liệu tồn khác.
  const warehouseScope = await resolveWarehouseScope(req.user);
  if (!isWarehouseInScope(warehouseScope, input.warehouseId)) {
    throw new HttpError(
      403,
      'Bạn không phụ trách kho này',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }

  res.json({ data: await previewStockAllocation(input) });
}

export async function quickReceiveStockController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseQuickReceiveInput(req.body);
  // Nhập nhanh ghi thẳng vào tồn của ô được quét, tức là ghi vào kho chứa ô đó;
  // phạm vi được kiểm bên trong giao dịch, trước khi có bất kỳ thay đổi nào.
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.status(201).json({
    data: await quickReceiveStock({ ...input, warehouseScope }),
  });
}
