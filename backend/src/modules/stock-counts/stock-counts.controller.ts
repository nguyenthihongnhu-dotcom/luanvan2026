import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  approveStockCount,
  rejectStockCount,
  createStockCount,
  listStockCountItems,
  listStockCounts,
  recordStockCountItem,
  startStockCount,
  submitStockCount,
} from './stock-counts.service';
import {
  parseCreateStockCount,
  parseRecordStockCountItem,
  parseRejectStockCount,
  parseStockCountId,
  parseStockCountItemId,
  parseStockCountsFilters,
} from './stock-counts.validation';

function requireAuthenticatedUser(req: Request): number {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  return Number(req.user.id);
}

export async function listStockCountsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockCountsFilters(req.query);

  res.json({ data: await listStockCounts(filters) });
}

export async function listStockCountItemsController(
  req: Request,
  res: Response,
): Promise<void> {
  const stockCountId = parseStockCountId(req.params.id);

  res.json({ data: await listStockCountItems(stockCountId) });
}

export async function createStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const input = parseCreateStockCount(req.body, userId);

  res.status(201).json({ data: await createStockCount(input) });
}

export async function startStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);

  res.json({
    data: await startStockCount({ stockCountId, startedBy: userId }),
  });
}

export async function recordStockCountItemController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);
  const itemId = parseStockCountItemId(req.params.itemId);
  const input = parseRecordStockCountItem(
    req.body,
    stockCountId,
    itemId,
    userId,
  );

  res.json({ data: await recordStockCountItem(input) });
}

export async function submitStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);

  res.json({
    data: await submitStockCount({ stockCountId, submittedBy: userId }),
  });
}

export async function rejectStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);
  const { rejectionReason } = parseRejectStockCount(req.body);

  res.json({
    data: await rejectStockCount({
      stockCountId,
      rejectedBy: userId,
      rejectionReason,
    }),
  });
}

export async function approveStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);

  res.json({
    data: await approveStockCount({ stockCountId, approvedBy: userId }),
  });
}
