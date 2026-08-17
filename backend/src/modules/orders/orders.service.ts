import { HttpError } from '../../common/http';

import type {
  CreateOrderGoodsIssueInput,
  CreateOrderInput,
  OrdersFilters,
  UpdateOrderInput,
} from './orders.model';

import {
  cancelOrder as cancelOrderRepository,
  completeOrder as completeOrderRepository,
  confirmOrder as confirmOrderRepository,
  findOrderDetail,
  findOrderGoodsIssues,
  findOrderItems,
  findOrders,
  insertGoodsIssueFromOrder,
  insertOrder,
  processOrder as processOrderRepository,
  updateOrder as updateOrderRepository,
} from './orders.repository';

const errorMap: Record<string, HttpError> = {
  INSUFFICIENT_ORDER_STOCK: new HttpError(
    409,
    'Số lượng sản phẩm trong kho không đủ để bán',
    'INSUFFICIENT_ORDER_STOCK',
  ),

  ORDER_NOT_FOUND: new HttpError(404, 'Order not found', 'ORDER_NOT_FOUND'),

  ORDER_NOT_CONFIRMABLE: new HttpError(
    409,
    'Order cannot be confirmed in its current status',
    'ORDER_NOT_CONFIRMABLE',
  ),

  ORDER_NOT_PROCESSABLE: new HttpError(
    409,
    'Order cannot be processed in its current status',
    'ORDER_NOT_PROCESSABLE',
  ),

  ORDER_NOT_CANCELLABLE: new HttpError(
    409,
    'Order cannot be cancelled',
    'ORDER_NOT_CANCELLABLE',
  ),

  ORDER_NOT_COMPLETEABLE: new HttpError(
    409,
    'Order cannot be completed until all items are issued',
    'ORDER_NOT_COMPLETEABLE',
  ),

  ORDER_NOT_EDITABLE: new HttpError(
    409,
    'Only DRAFT or PENDING orders can be edited',
    'ORDER_NOT_EDITABLE',
  ),

  ORDER_NOT_READY_FOR_ISSUE: new HttpError(
    409,
    'Order is not ready for warehouse issue',
    'ORDER_NOT_READY_FOR_ISSUE',
  ),

  ORDER_HAS_NO_REMAINING_ITEMS: new HttpError(
    409,
    'Order has no remaining items to issue',
    'ORDER_HAS_NO_REMAINING_ITEMS',
  ),
};

function mapError(error: unknown): never {
  if (error instanceof Error && errorMap[error.message]) {
    throw errorMap[error.message];
  }

  throw error;
}

export async function listOrders(filters: OrdersFilters) {
  return findOrders(filters);
}

export async function getOrderDetail(id: number) {
  const result = await findOrderDetail(id);

  if (!result) {
    throw errorMap.ORDER_NOT_FOUND;
  }

  return result;
}

export async function getOrderItems(id: number) {
  const result = await findOrderDetail(id);

  if (!result) {
    throw errorMap.ORDER_NOT_FOUND;
  }

  return findOrderItems(id);
}

export async function getOrderGoodsIssues(id: number) {
  const result = await findOrderDetail(id);

  if (!result) {
    throw errorMap.ORDER_NOT_FOUND;
  }

  return findOrderGoodsIssues(id);
}

export async function createOrder(input: CreateOrderInput) {
  try {
    return await insertOrder(input);
  } catch (error) {
    return mapError(error);
  }
}

export async function updateOrder(id: number, input: UpdateOrderInput) {
  try {
    return await updateOrderRepository(id, input);
  } catch (error) {
    return mapError(error);
  }
}

export async function confirmOrder(id: number, userId: number) {
  try {
    return await confirmOrderRepository(id, userId);
  } catch (error) {
    return mapError(error);
  }
}

export async function processOrder(id: number, userId: number) {
  try {
    return await processOrderRepository(id, userId);
  } catch (error) {
    return mapError(error);
  }
}

export async function cancelOrder(id: number, userId: number) {
  try {
    return await cancelOrderRepository(id, userId);
  } catch (error) {
    return mapError(error);
  }
}

export async function completeOrder(id: number, userId: number) {
  try {
    return await completeOrderRepository(id, userId);
  } catch (error) {
    return mapError(error);
  }
}

export async function createGoodsIssueFromOrder(
  input: CreateOrderGoodsIssueInput,
) {
  try {
    return await insertGoodsIssueFromOrder(input);
  } catch (error) {
    return mapError(error);
  }
}
