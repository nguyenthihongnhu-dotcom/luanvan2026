import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  approveStockAdjustment,
  listStockAdjustments,
} from './stock-adjustments.service';
import {
  parseStockAdjustmentId,
  parseStockAdjustmentsFilters,
} from './stock-adjustments.validation';

export async function listStockAdjustmentsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockAdjustmentsFilters(req.query);

  res.json({ data: await listStockAdjustments(filters) });
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
