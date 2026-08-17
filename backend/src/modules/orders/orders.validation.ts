import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  CreateOrderInput,
  OrdersFilters,
  UpdateOrderInput,
} from './orders.model';

const filtersSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(191).optional(),
  status: z.string().trim().min(1).max(50).optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
});

const createOrderItemSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  note: z.string().trim().max(500).optional(),
});

const createOrderSchema = z.object({
  orderCode: z.string().trim().min(1).max(80).optional(),

  customerName: z.string().trim().min(1).max(150),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: z.string().trim().email().max(191).optional(),

  shippingAddress: z.string().trim().max(500).optional(),
  shippingWard: z.string().trim().max(100).optional(),
  shippingDistrict: z.string().trim().max(100).optional(),
  shippingProvince: z.string().trim().max(100).optional(),

  warehouseId: z.coerce.number().int().positive(),

  items: z
    .array(createOrderItemSchema)
    .min(1, 'Đơn hàng phải có ít nhất một sản phẩm'),

  discountAmount: z.coerce.number().min(0).optional(),
  shippingFee: z.coerce.number().min(0).optional(),

  note: z.string().trim().max(1000).optional(),

  createdBy: z.coerce.number().int().positive().optional(),
});

const updateOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(150).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: z.string().trim().email().max(191).optional(),

  shippingAddress: z.string().trim().max(500).optional(),
  shippingWard: z.string().trim().max(100).optional(),
  shippingDistrict: z.string().trim().max(100).optional(),
  shippingProvince: z.string().trim().max(100).optional(),

  discountAmount: z.coerce.number().min(0).optional(),
  shippingFee: z.coerce.number().min(0).optional(),

  note: z.string().trim().max(1000).optional(),
});

export function parseOrdersFilters(input: unknown): OrdersFilters {
  return validateInput(filtersSchema, input);
}

export function parseOrderId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseCreateOrder(input: unknown): CreateOrderInput {
  return validateInput(createOrderSchema, input);
}

export function parseUpdateOrder(
  input: unknown,
): Omit<UpdateOrderInput, 'updatedBy'> {
  return validateInput(updateOrderSchema, input);
}

export function parseOrderItemIds(input: unknown): number[] {
  return validateInput(z.array(z.coerce.number().int().positive()), input);
}
