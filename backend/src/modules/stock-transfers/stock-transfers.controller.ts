import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  confirmStockTransfer,
  listStockTransfers,
  reverseStockTransfer,
} from './stock-transfers.service';
import {
  parseStockTransferId,
  parseStockTransfersFilters,
} from './stock-transfers.validation';

export async function listStockTransfersController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockTransfersFilters(req.query);

  res.json({ data: await listStockTransfers(filters) });
}

export async function confirmStockTransferController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const transferId = parseStockTransferId(req.params.id);

  res.json({
    data: await confirmStockTransfer({
      transferId,
      confirmedBy: Number(req.user.id),
    }),
  });
}

export async function reverseStockTransferController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const transferId = parseStockTransferId(req.params.id);

  res.json({
    data: await reverseStockTransfer({
      transferId,
      reversedBy: Number(req.user.id),
    }),
  });
}
