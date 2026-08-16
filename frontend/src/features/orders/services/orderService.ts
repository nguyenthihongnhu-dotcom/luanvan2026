import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type OrderStatus =
    | 'DRAFT'
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'PARTIALLY_ISSUED'
    | 'ISSUED'
    | 'COMPLETED'
    | 'CANCELLED';

export interface Order {
    id: number;
    order_code: string;

    customer_name: string;
    customer_phone?: string | null;
    customer_email?: string | null;

    shipping_address?: string | null;
    shipping_ward?: string | null;
    shipping_district?: string | null;
    shipping_province?: string | null;

    warehouse_id: number;
    warehouse_code?: string | null;
    warehouse_name?: string | null;

    status: OrderStatus;

    subtotal: number;
    discount_amount: number;
    shipping_fee: number;
    total_amount: number;

    note?: string | null;

    created_by: number;
    created_by_name?: string | null;

    updated_by?: number | null;

    ordered_at?: string | null;
    confirmed_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_variant_id: number;

    sku?: string | null;
    product_name?: string | null;
    variant_name?: string | null;

    ordered_quantity: number;
    issued_quantity: number;
    remaining_quantity?: number;

    unit_price: number;
    subtotal: number;

    note?: string | null;
}

export interface OrderDetail {
    header: Order;
    items: OrderItem[];
}

export interface OrderGoodsIssue {
    id: number;
    issue_code: string;
    order_id: number;
    warehouse_id: number;
    status: string;
    reference_no?: string | null;
    issued_at?: string | null;
    created_at?: string;
}

export interface CreateOrderItemInput {
    productVariantId: number;
    quantity: number;
    unitPrice: number;
    note?: string;
}

export interface CreateOrderInput {
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
}

export interface UpdateOrderInput {
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
}

export interface OrderFilters {
    id?: number;
    search?: string;
    status?: OrderStatus;
    warehouseId?: number;
}

export interface CreateGoodsIssueFromOrderInput {
    orderItemIds?: number[];
    note?: string;
}

export interface CreateGoodsIssueFromOrderResult {
    goodsIssueId: number;
    goodsIssueCode: string;
}

export async function listOrders(
    filters?: OrderFilters,
): Promise<Order[]> {
    const response = await httpClient.get<{ data: Order[] }>(
        '/orders',
        { params: filters },
    );

    return unwrapData(response);
}

export async function getOrderDetail(
    id: number,
): Promise<OrderDetail> {
    const response = await httpClient.get<{
        data: OrderDetail;
    }>(`/orders/${id}`);

    return unwrapData(response);
}

export async function listOrderItems(
    orderId: number,
): Promise<OrderItem[]> {
    const response = await httpClient.get<{
        data: OrderItem[];
    }>(`/orders/${orderId}/items`);

    return unwrapData(response);
}

export async function listOrderGoodsIssues(
    orderId: number,
): Promise<OrderGoodsIssue[]> {
    const response = await httpClient.get<{
        data: OrderGoodsIssue[];
    }>(`/orders/${orderId}/goods-issues`);

    return unwrapData(response);
}

export async function createOrder(
    input: CreateOrderInput,
): Promise<{
    id: number;
    orderCode: string;
}> {
    const response = await httpClient.post<{
        data: {
            id: number;
            orderCode: string;
        };
    }>('/orders', input);

    return unwrapData(response);
}

export async function updateOrder(
    id: number,
    input: UpdateOrderInput,
): Promise<void> {
    await httpClient.patch(`/orders/${id}`, input);
}

export async function confirmOrder(id: number): Promise<void> {
    await httpClient.post(`/orders/${id}/confirm`);
}

export async function processOrder(id: number): Promise<void> {
    await httpClient.post(`/orders/${id}/process`);
}

export async function cancelOrder(id: number): Promise<void> {
    await httpClient.post(`/orders/${id}/cancel`);
}

export async function completeOrder(id: number): Promise<void> {
    await httpClient.post(`/orders/${id}/complete`);
}

export async function createGoodsIssueFromOrder(
    orderId: number,
    input?: CreateGoodsIssueFromOrderInput,
): Promise<CreateGoodsIssueFromOrderResult> {
    const response = await httpClient.post<{
        data: CreateGoodsIssueFromOrderResult;
    }>(
        `/orders/${orderId}/goods-issues`,
        input ?? {},
    );

    return unwrapData(response);
}

export const orderService = {
    listOrders,
    getOrderDetail,
    listOrderItems,
    listOrderGoodsIssues,

    createOrder,
    updateOrder,

    confirmOrder,
    processOrder,
    cancelOrder,
    completeOrder,

    createGoodsIssueFromOrder,
};