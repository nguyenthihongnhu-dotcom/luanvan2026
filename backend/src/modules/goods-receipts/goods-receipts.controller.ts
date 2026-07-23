import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  confirmGoodsReceipt,
  listGoodsReceipts,
  reverseGoodsReceipt,
  createGoodsReceipt,
  getGoodsReceiptDetail,
} from './goods-receipts.service';
import {
  parseGoodsReceiptId,
  parseGoodsReceiptsFilters,
  parseCreateGoodsReceipt,
} from './goods-receipts.validation';

export async function listGoodsReceiptsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseGoodsReceiptsFilters(req.query);

  res.json({ data: await listGoodsReceipts(filters) });
}

export async function getGoodsReceiptDetailController(
  req: Request,
  res: Response,
): Promise<void> {
  const receiptId = parseGoodsReceiptId(req.params.id);
  res.json({ data: await getGoodsReceiptDetail(receiptId) });
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

export async function reverseGoodsReceiptController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const receiptId = parseGoodsReceiptId(req.params.id);

  res.json({
    data: await reverseGoodsReceipt({
      receiptId,
      reversedBy: Number(req.user.id),
    }),
  });
}
export async function createGoodsReceiptController(
  req: Request,
  res: Response,
): Promise<void> {
  res.status(201).json({
    data: await createGoodsReceipt(parseCreateGoodsReceipt(req.body)),
  });
}
