import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { generateDocumentCode } from '../../common/code/document-code';
import {
  UNRESTRICTED_SCOPE,
  warehouseScopeWhere,
} from '../../common/access/warehouse-scope';
import { db } from '../../database/db';

import type {
  CreateOrderGoodsIssueInput,
  CreateOrderGoodsIssueResult,
  CreateOrderInput,
  OrderGoodsIssueRow,
  OrderItemRow,
  OrderRow,
  OrdersFilters,
  QueryParams,
  UpdateOrderInput,
} from './orders.model';

export async function findOrders(filters: OrdersFilters): Promise<OrderRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('o.id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(o.order_code LIKE :search OR o.customer_name LIKE :search OR o.customer_phone LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('o.status = :status');
    params.status = filters.status;
  }

  if (filters.warehouseId) {
    where.push('o.warehouse_id = :warehouseId');
    params.warehouseId = filters.warehouseId;
  }

  const scopeWhere = warehouseScopeWhere(
    filters.warehouseScope ?? UNRESTRICTED_SCOPE,
    'o.warehouse_id',
    params,
  );
  if (scopeWhere) where.push(scopeWhere);

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<OrderRow[]>({
    sql: `
      SELECT
        o.*,
        w.code AS warehouse_code,
        w.name AS warehouse_name,
        u.full_name AS created_by_name
      FROM orders o
      LEFT JOIN warehouses w
        ON w.id = o.warehouse_id
      LEFT JOIN users u
        ON u.id = o.created_by
      ${whereSql}
      ORDER BY o.id DESC
      LIMIT 100
    `,
    values: params,
  });

  return rows;
}

export async function findOrderDetail(id: number): Promise<
  | {
      header: RowDataPacket;
      items: RowDataPacket[];
    }
  | undefined
> {
  const [headers] = await db.query<RowDataPacket[]>(
    `
      SELECT
        o.*,
        w.code AS warehouse_code,
        w.name AS warehouse_name,
        u.full_name AS created_by_name
      FROM orders o
      LEFT JOIN warehouses w
        ON w.id = o.warehouse_id
      LEFT JOIN users u
        ON u.id = o.created_by
      WHERE o.id = ?
      LIMIT 1
    `,
    [id],
  );

  const header = headers[0];

  if (!header) {
    return undefined;
  }

  const [items] = await db.query<RowDataPacket[]>(
    `
      SELECT
        oi.*,
        pv.sku,
        pv.variant_name,
        p.name AS product_name,
        (oi.ordered_quantity - oi.issued_quantity)
          AS remaining_quantity
      FROM order_items oi
      LEFT JOIN product_variants pv
        ON pv.id = oi.product_variant_id
      LEFT JOIN products p
        ON p.id = pv.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `,
    [id],
  );

  return {
    header,
    items,
  };
}

export async function findOrderItems(orderId: number): Promise<OrderItemRow[]> {
  const [rows] = await db.query<OrderItemRow[]>(
    `
      SELECT
        oi.*,
        pv.sku,
        pv.variant_name,
        p.name AS product_name
      FROM order_items oi
      LEFT JOIN product_variants pv
        ON pv.id = oi.product_variant_id
      LEFT JOIN products p
        ON p.id = pv.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `,
    [orderId],
  );

  return rows;
}

export async function findOrderGoodsIssues(
  orderId: number,
): Promise<OrderGoodsIssueRow[]> {
  const [rows] = await db.query<OrderGoodsIssueRow[]>(
    `
      SELECT
        gi.id,
        gi.issue_code,
        gi.order_id,
        gi.warehouse_id,
        gi.status,
        gi.reference_no,
        gi.issued_at,
        gi.created_at
      FROM goods_issues gi
      WHERE gi.order_id = ?
      ORDER BY gi.id DESC
    `,
    [orderId],
  );

  return rows;
}

export async function insertOrder(
  input: CreateOrderInput,
): Promise<{ id: number; orderCode: string }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const orderCode =
      input.orderCode ??
      (await generateDocumentCode(connection, 'orders', 'order_code', 'DH'));

    const discountAmount = input.discountAmount ?? 0;
    const shippingFee = input.shippingFee ?? 0;

    let subtotal = 0;

    for (const item of input.items) {
      const [stockRows] = await connection.query<RowDataPacket[]>(
        `
        SELECT
            COALESCE(
                SUM(sl.available_quantity),
                0
            ) AS available_quantity
        FROM stock_locations sl
        INNER JOIN warehouse_locations wl
            ON wl.id = sl.location_id
        INNER JOIN warehouse_shelves ws
            ON ws.id = wl.shelf_id
        INNER JOIN warehouse_zones wz
            ON wz.id = ws.zone_id
        WHERE sl.product_variant_id = ?
          AND wz.warehouse_id = ?
        `,
        [item.productVariantId, input.warehouseId],
      );

      const availableQuantity = Number(stockRows[0]?.available_quantity ?? 0);

      if (availableQuantity < item.quantity) {
        throw new Error(
          `INSUFFICIENT_ORDER_STOCK:${item.productVariantId}:${availableQuantity}`,
        );
      }

      subtotal += item.quantity * item.unitPrice;
    }

    const totalAmount = subtotal - discountAmount + shippingFee;

    const [result] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO orders (
          order_code,
          customer_name,
          customer_phone,
          customer_email,
          shipping_address,
          shipping_ward,
          shipping_district,
          shipping_province,
          warehouse_id,
          status,
          subtotal,
          discount_amount,
          shipping_fee,
          total_amount,
          note,
          created_by,
          ordered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT',
                ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      `,
      [
        orderCode,
        input.customerName,
        input.customerPhone ?? null,
        input.customerEmail ?? null,
        input.shippingAddress ?? null,
        input.shippingWard ?? null,
        input.shippingDistrict ?? null,
        input.shippingProvince ?? null,
        input.warehouseId,
        subtotal,
        discountAmount,
        shippingFee,
        totalAmount,
        input.note ?? null,
        input.createdBy ?? null,
      ],
    );

    for (const item of input.items) {
      await connection.query(
        `
          INSERT INTO order_items (
            order_id,
            product_variant_id,
            ordered_quantity,
            issued_quantity,
            unit_price,
            subtotal,
            note
          )
          VALUES (?, ?, ?, 0, ?, ?, ?)
        `,
        [
          result.insertId,
          item.productVariantId,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice,
          item.note ?? null,
        ],
      );
    }

    await connection.commit();

    return {
      id: result.insertId,
      orderCode,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateOrder(
  id: number,
  input: UpdateOrderInput,
): Promise<void> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query<OrderRow[]>(
      `
        SELECT *
        FROM orders
        WHERE id = ?
        FOR UPDATE
      `,
      [id],
    );

    const order = orders[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (!['DRAFT', 'PENDING'].includes(order.status)) {
      throw new Error('ORDER_NOT_EDITABLE');
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const addField = (field: string, value: unknown) => {
      fields.push(`${field} = ?`);
      values.push(value);
    };

    if (input.customerName !== undefined) {
      addField('customer_name', input.customerName);
    }

    if (input.customerPhone !== undefined) {
      addField('customer_phone', input.customerPhone);
    }

    if (input.customerEmail !== undefined) {
      addField('customer_email', input.customerEmail);
    }

    if (input.shippingAddress !== undefined) {
      addField('shipping_address', input.shippingAddress);
    }

    if (input.shippingWard !== undefined) {
      addField('shipping_ward', input.shippingWard);
    }

    if (input.shippingDistrict !== undefined) {
      addField('shipping_district', input.shippingDistrict);
    }

    if (input.shippingProvince !== undefined) {
      addField('shipping_province', input.shippingProvince);
    }

    if (input.discountAmount !== undefined) {
      addField('discount_amount', input.discountAmount);
    }

    if (input.shippingFee !== undefined) {
      addField('shipping_fee', input.shippingFee);
    }

    if (input.note !== undefined) {
      addField('note', input.note);
    }

    if (fields.length > 0) {
      values.push(id);

      await connection.query(
        `
          UPDATE orders
          SET ${fields.join(', ')},
              updated_by = ?
          WHERE id = ?
        `,
        [...values.slice(0, -1), input.updatedBy, id],
      );
    }

    await connection.query(
      `
        UPDATE orders
        SET total_amount =
          subtotal - discount_amount + shipping_fee
        WHERE id = ?
      `,
      [id],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrderStatus(
  id: number,
  status: string,
  userId: number,
): Promise<void> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<OrderRow[]>(
      `
        SELECT *
        FROM orders
        WHERE id = ?
        FOR UPDATE
      `,
      [id],
    );

    const order = rows[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    await connection.query(
      `
        UPDATE orders
        SET
          status = ?,
          updated_by = ?,
          confirmed_at =
            CASE
              WHEN ? = 'CONFIRMED'
              THEN CURRENT_TIMESTAMP(3)
              ELSE confirmed_at
            END,
          completed_at =
            CASE
              WHEN ? = 'COMPLETED'
              THEN CURRENT_TIMESTAMP(3)
              ELSE completed_at
            END,
          cancelled_at =
            CASE
              WHEN ? = 'CANCELLED'
              THEN CURRENT_TIMESTAMP(3)
              ELSE cancelled_at
            END
        WHERE id = ?
      `,
      [status, userId, status, status, status, id],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function confirmOrder(id: number, userId: number): Promise<void> {
  const [rows] = await db.query<OrderRow[]>(
    `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  if (!rows[0]) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (!['DRAFT', 'PENDING'].includes(rows[0].status)) {
    throw new Error('ORDER_NOT_CONFIRMABLE');
  }

  await updateOrderStatus(id, 'CONFIRMED', userId);
}

export async function processOrder(id: number, userId: number): Promise<void> {
  const [rows] = await db.query<OrderRow[]>(
    `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  if (!rows[0]) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (!['CONFIRMED', 'PARTIALLY_ISSUED'].includes(rows[0].status)) {
    throw new Error('ORDER_NOT_PROCESSABLE');
  }

  await updateOrderStatus(id, 'PROCESSING', userId);
}

export async function cancelOrder(id: number, userId: number): Promise<void> {
  const [rows] = await db.query<OrderRow[]>(
    `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  if (!rows[0]) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (['COMPLETED', 'CANCELLED', 'ISSUED'].includes(rows[0].status)) {
    throw new Error('ORDER_NOT_CANCELLABLE');
  }

  await updateOrderStatus(id, 'CANCELLED', userId);
}

export async function completeOrder(id: number, userId: number): Promise<void> {
  const [rows] = await db.query<OrderRow[]>(
    `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  if (!rows[0]) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (rows[0].status !== 'ISSUED') {
    throw new Error('ORDER_NOT_COMPLETEABLE');
  }

  await updateOrderStatus(id, 'COMPLETED', userId);
}

export async function insertGoodsIssueFromOrder(
  input: CreateOrderGoodsIssueInput,
): Promise<CreateOrderGoodsIssueResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query<OrderRow[]>(
      `
        SELECT *
        FROM orders
        WHERE id = ?
        FOR UPDATE
      `,
      [input.orderId],
    );

    const order = orders[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (
      !['CONFIRMED', 'PROCESSING', 'PARTIALLY_ISSUED'].includes(order.status)
    ) {
      throw new Error('ORDER_NOT_READY_FOR_ISSUE');
    }

    const itemParams: unknown[] = [input.orderId];

    let itemCondition = '';

    if (input.orderItemIds && input.orderItemIds.length > 0) {
      itemCondition = `
        AND oi.id IN (${input.orderItemIds.map(() => '?').join(',')})
      `;

      itemParams.push(...input.orderItemIds);
    }

    const [items] = await connection.query<OrderItemRow[]>(
      `
        SELECT *
        FROM order_items oi
        WHERE oi.order_id = ?
          AND oi.ordered_quantity > oi.issued_quantity
          ${itemCondition}
        FOR UPDATE
      `,
      itemParams,
    );

    if (items.length === 0) {
      throw new Error('ORDER_HAS_NO_REMAINING_ITEMS');
    }

    const issueCode = await generateDocumentCode(
      connection,
      'goods_issues',
      'issue_code',
      'PX',
    );

    const [issueResult] = await connection.query<ResultSetHeader>(
      `
          INSERT INTO goods_issues (
            issue_code,
            warehouse_id,
            order_id,
            status,
            reference_no,
            note,
            created_by
          )
          VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
        `,
      [
        issueCode,
        order.warehouse_id,
        order.id,
        order.order_code,
        input.note ?? null,
        input.createdBy,
      ],
    );

    for (const item of items) {
      const remaining =
        Number(item.ordered_quantity) - Number(item.issued_quantity);

      await connection.query(
        `
          INSERT INTO goods_issue_items (
            goods_issue_id,
            order_item_id,
            product_variant_id,
            batch_id,
            location_id,
            quantity,
            note
          )
          VALUES (?, ?, ?, NULL, 1, ?, ?)
        `,
        [
          issueResult.insertId,
          item.id,
          item.product_variant_id,
          remaining,
          item.note,
        ],
      );
    }

    await connection.query(
      `
        UPDATE orders
        SET
          status = 'PARTIALLY_ISSUED',
          updated_by = ?
        WHERE id = ?
      `,
      [input.createdBy, order.id],
    );

    await connection.commit();

    return {
      goodsIssueId: issueResult.insertId,
      goodsIssueCode: issueCode,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
