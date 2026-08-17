import type { Request, Response } from 'express';
import {
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
import { HttpError } from '../../common/http';
import {
  approveStockAdjustment,
  cancelStockAdjustment,
  listStockAdjustments,
  rejectStockAdjustment,
  createStockAdjustment,
  getStockAdjustmentDetail,
} from './stock-adjustments.service';
import {
  parseRejectStockAdjustment,
  parseStockAdjustmentId,
  parseStockAdjustmentsFilters,
  parseCreateStockAdjustment,
} from './stock-adjustments.validation';

export async function listStockAdjustmentsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockAdjustmentsFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listStockAdjustments({ ...filters, warehouseScope }),
  });
}

export async function getStockAdjustmentDetailController(
  req: Request,
  res: Response,
): Promise<void> {
  const adjustmentId = parseStockAdjustmentId(req.params.id);
  res.json({ data: await getStockAdjustmentDetail(adjustmentId) });
}
export async function approveStockAdjustmentController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const adjustmentId = parseStockAdjustmentId(req.params.id);

  res.json({
    data: await approveStockAdjustment({
      adjustmentId,
      approvedBy: Number(req.user.id),
    }),
  });
}

export async function rejectStockAdjustmentController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const adjustmentId = parseStockAdjustmentId(req.params.id);
  const input = parseRejectStockAdjustment(
    req.body,
    adjustmentId,
    Number(req.user.id),
  );

  res.json({ data: await rejectStockAdjustment(input) });
}

export async function cancelStockAdjustmentController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const adjustmentId = parseStockAdjustmentId(req.params.id);

  res.json({
    data: await cancelStockAdjustment({
      adjustmentId,
      cancelledBy: Number(req.user.id),
    }),
  });
}
export async function createStockAdjustmentController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateStockAdjustment(req.body);
  const warehouseScope = await resolveWarehouseScope(req.user);
  if (!isWarehouseInScope(warehouseScope, input.warehouseId)) {
    throw new HttpError(
      403,
      'Bạn không phụ trách kho này nên không tạo được chứng từ cho nó',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }

  const createdBy =
    input.createdBy ?? (req.user ? Number(req.user.id) : undefined);
  res.status(201).json({
    data: await createStockAdjustment({
      ...input,
      createdBy,
    }),
  });
}
