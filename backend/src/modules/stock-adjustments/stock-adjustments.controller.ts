import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  approveStockAdjustment,
  cancelStockAdjustment,
  listStockAdjustments,
  rejectStockAdjustment,
} from './stock-adjustments.service';
import {
  parseRejectStockAdjustment,
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