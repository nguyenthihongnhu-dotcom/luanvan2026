import type { Request, Response } from 'express';
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

  res.json({
    data: await listOrders(filters),
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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const input = parseCreateOrder(req.body);

  const createdBy =
    input.createdBy ?? Number(req.user.id);

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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const orderId = parseOrderId(req.params.id);
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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const orderId = parseOrderId(req.params.id);

  await confirmOrder(
    orderId,
    Number(req.user.id),
  );

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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const orderId = parseOrderId(req.params.id);

  await processOrder(
    orderId,
    Number(req.user.id),
  );

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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const orderId = parseOrderId(req.params.id);

  await cancelOrder(
    orderId,
    Number(req.user.id),
  );

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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const orderId = parseOrderId(req.params.id);

  await completeOrder(
    orderId,
    Number(req.user.id),
  );

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
    throw new HttpError(
      401,
      'Authentication required',
      'AUTH_REQUIRED',
    );
  }

  const orderId = parseOrderId(req.params.id);

  let orderItemIds: number[] | undefined;

  if (req.body?.orderItemIds !== undefined) {
    orderItemIds = parseOrderItemIds(
      req.body.orderItemIds,
    );
  }

  res.status(201).json({
    data: await createGoodsIssueFromOrder({
      orderId,
      orderItemIds,
      note: req.body?.note,
      createdBy: Number(req.user.id),
    }),
  });
}