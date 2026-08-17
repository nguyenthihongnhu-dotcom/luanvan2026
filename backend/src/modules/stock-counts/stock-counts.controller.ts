import type { Request, Response } from 'express';
import {
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
import { HttpError } from '../../common/http';
import {
  approveStockCount,
  getStockCountWarehouseId,
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

/**
 * Mọi thao tác trên một phiếu kiểm kê đã có id đều phải kiểm tra phiếu đó thuộc
 * kho người dùng phụ trách: quyền stock_counts:count và :submit được cấp cho nhân
 * viên kho, không chặn theo kho thì họ đếm và gửi duyệt được phiếu của kho khác.
 */
async function assertStockCountInScope(
  req: Request,
  stockCountId: number,
): Promise<void> {
  const scope = await resolveWarehouseScope(req.user);
  if (scope.unrestricted) return;

  const warehouseId = await getStockCountWarehouseId(stockCountId);
  if (!isWarehouseInScope(scope, warehouseId)) {
    throw new HttpError(
      403,
      'Phiếu kiểm kê này thuộc kho bạn không phụ trách',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }
}

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
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listStockCounts({ ...filters, warehouseScope }) });
}

export async function listStockCountItemsController(
  req: Request,
  res: Response,
): Promise<void> {
  const stockCountId = parseStockCountId(req.params.id);
  await assertStockCountInScope(req, stockCountId);

  res.json({ data: await listStockCountItems(stockCountId) });
}

export async function createStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const input = parseCreateStockCount(req.body, userId);
  const warehouseScope = await resolveWarehouseScope(req.user);
  if (!isWarehouseInScope(warehouseScope, input.warehouseId)) {
    throw new HttpError(
      403,
      'Bạn không phụ trách kho này nên không tạo được chứng từ cho nó',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }

  res.status(201).json({ data: await createStockCount(input) });
}

export async function startStockCountController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);
  await assertStockCountInScope(req, stockCountId);

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
  await assertStockCountInScope(req, stockCountId);
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
  await assertStockCountInScope(req, stockCountId);

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
  await assertStockCountInScope(req, stockCountId);
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
  await assertStockCountInScope(req, stockCountId);

  res.json({
    data: await approveStockCount({ stockCountId, approvedBy: userId }),
  });
}
