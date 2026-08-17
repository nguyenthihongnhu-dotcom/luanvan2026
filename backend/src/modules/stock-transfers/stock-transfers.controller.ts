import type { Request, Response } from 'express';
import {
  assertDocumentWarehouseInScope,
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
import { HttpError } from '../../common/http';
import {
  confirmStockTransfer,
  createStockTransfer,
  listStockTransfers,
  reverseStockTransfer,
} from './stock-transfers.service';
import {
  parseStockTransferId,
  parseCreateStockTransferInput,
  parseStockTransfersFilters,
} from './stock-transfers.validation';

export async function listStockTransfersController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseStockTransfersFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listStockTransfers({ ...filters, warehouseScope }) });
}

export async function confirmStockTransferController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const transferId = parseStockTransferId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'stock_transfers', transferId);

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
  await assertDocumentWarehouseInScope(req.user, 'stock_transfers', transferId);

  res.json({
    data: await reverseStockTransfer({
      transferId,
      reversedBy: Number(req.user.id),
    }),
  });
}

export async function createStockTransferController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateStockTransferInput(req.body);
  const warehouseScope = await resolveWarehouseScope(req.user);
  // Chuyển kho đụng vào tồn của cả hai đầu nên phải phụ trách cả hai mới tạo được.
  const outOfScope = [
    input.sourceWarehouseId,
    input.destinationWarehouseId,
  ].some((warehouseId) => !isWarehouseInScope(warehouseScope, warehouseId));
  if (outOfScope) {
    throw new HttpError(
      403,
      'Bạn phải phụ trách cả kho nguồn và kho đích mới tạo được phiếu chuyển',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }

  res.status(201).json({ data: await createStockTransfer(input) });
}
