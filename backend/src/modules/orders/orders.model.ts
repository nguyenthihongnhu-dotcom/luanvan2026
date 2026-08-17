import type { WarehouseScope } from '../../common/access/warehouse-scope';
import type { RowDataPacket } from 'mysql2';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PARTIALLY_ISSUED'
  | 'ISSUED'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrdersFilters = {
  id?: number;
  search?: string;
  status?: string;
  warehouseId?: number;
  /** Giới hạn theo kho người dùng phụ trách; bỏ trống nghĩa là không giới hạn. */
  warehouseScope?: WarehouseScope;
};

export type QueryParams = Record<string, string | number | null>;

export type OrderRow = RowDataPacket & {
  id: number;
  order_code: string;

  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;

  shipping_address: string | null;
  shipping_ward: string | null;
  shipping_district: string | null;
  shipping_province: string | null;

  warehouse_id: number;

  status: OrderStatus;

  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;

  note: string | null;

  created_by: number;
  updated_by: number | null;

  ordered_at: Date | null;
  confirmed_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
};

export type OrderItemRow = RowDataPacket & {
  id: number;
  order_id: number;
  product_variant_id: number;

  ordered_quantity: number;
  issued_quantity: number;

  unit_price: number;
  subtotal: number;

  note: string | null;
};

export type CreateOrderItemInput = {
  productVariantId: number;
  quantity: number;
  unitPrice: number;
  note?: string;
};

export type CreateOrderInput = {
  orderCode?: string;

  customerName: string;
  customerPhone?: string;
  customerEmail?: string;

  shippingAddress?: string;
  shippingWard?: string;
  shippingDistrict?: string;
  shippingProvince?: string;

  warehouseId: number;

  items: CreateOrderItemInput[];

  discountAmount?: number;
  shippingFee?: number;

  note?: string;

  createdBy?: number;
};

export type UpdateOrderInput = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;

  shippingAddress?: string;
  shippingWard?: string;
  shippingDistrict?: string;
  shippingProvince?: string;

  discountAmount?: number;
  shippingFee?: number;

  note?: string;

  updatedBy: number;
};

export type OrderGoodsIssueRow = RowDataPacket & {
  id: number;
  issue_code: string;
  order_id: number;
  warehouse_id: number;

  status: string;

  reference_no: string | null;
  issued_at: Date | null;
  created_at: Date;
};

export type CreateOrderGoodsIssueInput = {
  orderId: number;
  orderItemIds?: number[];
  note?: string;
  createdBy: number;
};

export type CreateOrderGoodsIssueResult = {
  goodsIssueId: number;
  goodsIssueCode: string;
};
