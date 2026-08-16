import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';

import {
  listOrdersController,
  getOrderDetailController,
  getOrderItemsController,
  getOrderGoodsIssuesController,
  createOrderController,
  updateOrderController,
  confirmOrderController,
  processOrderController,
  cancelOrderController,
  completeOrderController,
  createGoodsIssueFromOrderController,
} from './orders.controller';

export const ordersRouter = Router();

/**
 * =========================================================
 * ORDERS
 * =========================================================
 */

/**
 * GET /orders
 * Danh sách đơn hàng
 */
ordersRouter.get(
  '/',
  asyncHandler(listOrdersController),
);

/**
 * POST /orders
 * Tạo đơn hàng
 */
ordersRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(createOrderController),
);

/**
 * =========================================================
 * ORDER ITEMS / GOODS ISSUES
 * Phải đặt trước /:id
 * =========================================================
 */

/**
 * GET /orders/:id/items
 * Danh sách sản phẩm trong đơn hàng
 */
ordersRouter.get(
  '/:id/items',
  asyncHandler(getOrderItemsController),
);

/**
 * GET /orders/:id/goods-issues
 * Danh sách phiếu xuất của đơn hàng
 */
ordersRouter.get(
  '/:id/goods-issues',
  asyncHandler(getOrderGoodsIssuesController),
);

/**
 * POST /orders/:id/goods-issues
 * Tạo phiếu xuất kho từ đơn hàng
 */
ordersRouter.post(
  '/:id/goods-issues',
  asyncHandler(verifyToken),
  asyncHandler(createGoodsIssueFromOrderController),
);

/**
 * =========================================================
 * ORDER DETAIL
 * =========================================================
 */

/**
 * GET /orders/:id
 * Chi tiết đơn hàng
 */
ordersRouter.get(
  '/:id',
  asyncHandler(getOrderDetailController),
);

/**
 * PATCH /orders/:id
 * Cập nhật đơn hàng
 */
ordersRouter.patch(
  '/:id',
  asyncHandler(verifyToken),
  asyncHandler(updateOrderController),
);

/**
 * =========================================================
 * ORDER STATUS
 * =========================================================
 */

/**
 * POST /orders/:id/confirm
 * Xác nhận đơn hàng
 */
ordersRouter.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('orders:confirm'),
  asyncHandler(confirmOrderController),
);

/**
 * POST /orders/:id/process
 * Chuyển đơn hàng sang đang xử lý
 */
ordersRouter.post(
  '/:id/process',
  asyncHandler(verifyToken),
  asyncHandler(processOrderController),
);

/**
 * POST /orders/:id/cancel
 * Hủy đơn hàng
 */
ordersRouter.post(
  '/:id/cancel',
  asyncHandler(verifyToken),
  asyncHandler(cancelOrderController),
);

/**
 * POST /orders/:id/complete
 * Hoàn tất đơn hàng
 */
ordersRouter.post(
  '/:id/complete',
  asyncHandler(verifyToken),
  asyncHandler(completeOrderController),
);