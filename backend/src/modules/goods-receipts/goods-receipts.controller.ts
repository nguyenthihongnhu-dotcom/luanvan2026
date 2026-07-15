import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  confirmGoodsReceipt,
  listGoodsReceipts,
} from './goods-receipts.service';
import {
  parseGoodsReceiptId,
  parseGoodsReceiptsFilters,
} from './goods-receipts.validation';

export async function listGoodsReceiptsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseGoodsReceiptsFilters(req.query);

  res.json({ data: await listGoodsReceipts(filters) });
}

export async function confirmGoodsReceiptController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const receiptId = parseGoodsReceiptId(req.params.id);

  res.json({
    data: await confirmGoodsReceipt({
      receiptId,
      confirmedBy: Number(req.user.id),
    }),
  });
}
