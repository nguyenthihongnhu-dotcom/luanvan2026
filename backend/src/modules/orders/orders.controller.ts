import type { Request, Response } from 'express';
import {
  assertDocumentWarehouseInScope,
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
import { HttpError } from '../../common/http';

import {
  listOrders,
  getOrderDetail,
  getOrderItems,
  getOrderGoodsIssues,
  createOrder,
  updateOrder,
  confirmOrder,
  processOrder,
  cancelOrder,
  completeOrder,
  createGoodsIssueFromOrder,
} from './orders.service';

import {
  parseCreateOrder,
  parseOrderId,
  parseOrdersFilters,
  parseOrderItemIds,
  parseUpdateOrder,
} from './orders.validation';

/**
 * GET /orders
 */
export async function listOrdersController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseOrdersFilters(req.query);
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({
    data: await listOrders({ ...filters, warehouseScope }),
  });
}

/**
 * GET /orders/:id
 */
export async function getOrderDetailController(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  res.json({
    data: await getOrderDetail(orderId),
  });
}

/**
 * GET /orders/:id/items
 */
export async function getOrderItemsController(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  res.json({
    data: await getOrderItems(orderId),
  });
}

/**
 * GET /orders/:id/goods-issues
 */
export async function getOrderGoodsIssuesController(
  req: Request,
  res: Response,
): Promise<void> {
  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  res.json({
    data: await getOrderGoodsIssues(orderId),
  });
}

/**
 * POST /orders
 */
export async function createOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const input = parseCreateOrder(req.body);

  const warehouseScope = await resolveWarehouseScope(req.user);
  if (!isWarehouseInScope(warehouseScope, input.warehouseId)) {
    throw new HttpError(
      403,
      'Bạn không phụ trách kho này nên không tạo được đơn cho nó',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }

  const createdBy = input.createdBy ?? Number(req.user.id);

  res.status(201).json({
    data: await createOrder({
      ...input,
      createdBy,
    }),
  });
}

/**
 * PATCH /orders/:id
 */
export async function updateOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);
  const input = parseUpdateOrder(req.body);

  await updateOrder(orderId, {
    ...input,
    updatedBy: Number(req.user.id),
  });

  res.json({
    data: null,
  });
}

/**
 * POST /orders/:id/confirm
 */
export async function confirmOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  await confirmOrder(orderId, Number(req.user.id));

  res.json({
    data: null,
  });
}

/**
 * POST /orders/:id/process
 */
export async function processOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  await processOrder(orderId, Number(req.user.id));

  res.json({
    data: null,
  });
}

/**
 * POST /orders/:id/cancel
 */
export async function cancelOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  await cancelOrder(orderId, Number(req.user.id));

  res.json({
    data: null,
  });
}

/**
 * POST /orders/:id/complete
 */
export async function completeOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  await completeOrder(orderId, Number(req.user.id));

  res.json({
    data: null,
  });
}

/**
 * POST /orders/:id/goods-issues
 */
export async function createGoodsIssueFromOrderController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const orderId = parseOrderId(req.params.id);
  await assertDocumentWarehouseInScope(req.user, 'orders', orderId);

  // req.body là any, đọc thẳng từng thuộc tính khiến eslint không kiểm soát được
  // kiểu. Ép về một hình dạng đã biết rồi mới bóc, phần giá trị vẫn do
  // parseOrderItemIds kiểm tra như cũ.
  const body = (req.body ?? {}) as {
    orderItemIds?: unknown;
    note?: unknown;
  };
  const orderItemIds =
    body.orderItemIds === undefined
      ? undefined
      : parseOrderItemIds(body.orderItemIds);

  res.status(201).json({
    data: await createGoodsIssueFromOrder({
      orderId,
      orderItemIds,
      note: typeof body.note === 'string' ? body.note : undefined,
      createdBy: Number(req.user.id),
    }),
  });
}
