import type { Request, Response } from 'express';
import {
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
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
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listGoodsReceipts({ ...filters, warehouseScope }),
  });
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
  const input = parseCreateGoodsReceipt(req.body);
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
    data: await createGoodsReceipt({
      ...input,
      createdBy,
    }),
  });
}
