import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../../database/db';
import type {
  CatalogFilters,
  CatalogRow,
  CategoryInput,
  MutationResult,
  ProductInput,
  QueryParams,
} from './catalog.model';

type IdRow = RowDataPacket & { id: number };

function slugCode(value: string, prefix: string): string {
  return `${prefix}-${value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()}`.slice(0, 50);
}

export async function findCatalog(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  return findProducts(filters);
}

export async function findCategories(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  const where: string[] = ['deleted_at IS NULL'];
  const params: QueryParams = {};
  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }
  if (filters.search) {
    where.push('(code LIKE :search OR name LIKE :search)');
    params.search = `%${filters.search}%`;
  }
  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }
  const [rows] = await db.query<CatalogRow[]>({
    sql: `SELECT * FROM categories WHERE ${where.join(' AND ')} ORDER BY sort_order, id LIMIT 100`,
    values: params,
  });
  return rows;
}

export async function insertCategory(
  input: CategoryInput,
): Promise<{ id: number }> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO categories (code, name, description, status) VALUES (?, ?, ?, ?)`,
    [
      input.code ?? slugCode(input.name, 'DM'),
      input.name,
      input.description ?? null,
      input.status ?? 'ACTIVE',
    ],
  );
  return { id: result.insertId };
}

export async function updateCategory(
  id: number,
  input: CategoryInput,
): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE categories SET code = ?, name = ?, description = ?, status = ? WHERE id = ? AND deleted_at IS NULL`,
    [
      input.code ?? slugCode(input.name, 'DM'),
      input.name,
      input.description ?? null,
      input.status ?? 'ACTIVE',
      id,
    ],
  );
  return { affectedRows: result.affectedRows };
}

export async function softDeleteCategory(id: number): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE categories SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE' WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  return { affectedRows: result.affectedRows };
}

export async function findProducts(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  const where: string[] = ['p.deleted_at IS NULL', 'pv.deleted_at IS NULL'];
  const params: QueryParams = {};
  if (filters.id) {
    where.push('pv.id = :id');
    params.id = filters.id;
  }
  if (filters.search) {
    where.push(
      '(pv.sku LIKE :search OR p.name LIKE :search OR pv.variant_name LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }
  if (filters.status) {
    where.push('pv.status = :status');
    params.status = filters.status;
  }
  const [rows] = await db.query<CatalogRow[]>({
    sql: `
      SELECT pv.id, pv.sku, pv.variant_name, p.name AS product_name, c.name AS category_name,
        pv.min_stock_level,
        -- Cần cho màn hình lô hàng: biết SKU nào bắt buộc khai lô và hạn dùng
        pv.requires_lot_tracking, pv.requires_expiry_tracking,
        COALESCE(SUM(sl.quantity), 0) AS stock,
        MIN(pb.expiry_date) AS expiry_date,
        MIN(CASE WHEN sl.quantity > 0 THEN w.id END) AS warehouse_id,
        MIN(CASE WHEN sl.quantity > 0 THEN wl.id END) AS location_id,
        GROUP_CONCAT(DISTINCT CASE WHEN sl.quantity > 0 THEN wl.code END ORDER BY wl.code SEPARATOR ', ') AS locations
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_locations sl ON sl.product_variant_id = pv.id
      LEFT JOIN warehouse_locations wl ON wl.id = sl.location_id
      LEFT JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      LEFT JOIN warehouse_zones wz ON wz.id = ws.zone_id
      LEFT JOIN warehouses w ON w.id = wz.warehouse_id
      LEFT JOIN product_batches pb ON pb.id = sl.batch_id
      WHERE ${where.join(' AND ')}
      GROUP BY pv.id, pv.sku, pv.variant_name, p.name, c.name, pv.min_stock_level,
        pv.requires_lot_tracking, pv.requires_expiry_tracking
      ORDER BY pv.id
      LIMIT 100
    `,
    values: params,
  });
  return rows;
}

async function ensureCategoryId(categoryName: string): Promise<number> {
  const [existing] = await db.query<IdRow[]>(
    `SELECT id FROM categories WHERE name = ? AND deleted_at IS NULL LIMIT 1`,
    [categoryName],
  );
  if (existing[0]) return existing[0].id;
  const created = await insertCategory({ name: categoryName });
  return created.id;
}

export async function insertProduct(
  input: ProductInput,
): Promise<{ id: number }> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const categoryId = await ensureCategoryId(input.category);
    const productCode = slugCode(input.sku, 'SP');
    const [productResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO products (category_id, code, name, status) VALUES (?, ?, ?, 'ACTIVE')`,
      [categoryId, productCode, input.name],
    );
    const [unitRows] = await connection.query<IdRow[]>(
      `SELECT id FROM units WHERE code = 'PCS' LIMIT 1`,
    );
    const unitId = unitRows[0]?.id;
    const [variantResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO product_variants (product_id, unit_id, sku, variant_name, min_stock_level, requires_lot_tracking, requires_expiry_tracking, status)
       VALUES (?, ?, ?, ?, ?, TRUE, ?, 'ACTIVE')`,
      [
        productResult.insertId,
        unitId,
        input.sku,
        input.name,
        input.minStock ?? 0,
        input.expiryDate ? true : false,
      ],
    );
    // Khai báo sản phẩm không sinh tồn kho. Sản phẩm mới luôn bắt đầu ở 0 và chỉ
    // tăng khi có phiếu nhập kho được xác nhận — nhờ vậy mọi thay đổi tồn đều
    // truy ngược được về một chứng từ, không có đường nào cộng tồn lặng lẽ.
    // Vị trí và hạn dùng cũng thuộc về phiếu nhập và lô hàng, không phải danh mục.
    await connection.commit();
    return { id: variantResult.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<MutationResult> {
  const categoryId = await ensureCategoryId(input.category);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE product_variants pv JOIN products p ON p.id = pv.product_id
       SET pv.sku = ?, pv.variant_name = ?, pv.min_stock_level = ?, p.name = ?, p.category_id = ?
       WHERE pv.id = ? AND pv.deleted_at IS NULL`,
      [input.sku, input.name, input.minStock ?? 0, input.name, categoryId, id],
    );

    // Tồn kho không sửa được từ màn danh mục: mọi thay đổi số lượng phải đi qua
    // phiếu nhập, xuất, chuyển hoặc điều chỉnh để còn truy vết được bằng chứng từ.

    await connection.commit();
    return { affectedRows: result.affectedRows };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Đếm số chứng từ kho đã tham chiếu tới sản phẩm. Xóa sản phẩm đã từng đi qua
 * phiếu nhập/xuất/điều chỉnh sẽ làm hỏng nhật ký kho: các phiếu cũ mất đối tượng
 * tham chiếu và báo cáo lịch sử không dựng lại được.
 */
export async function countProductDocumentReferences(
  id: number,
): Promise<number> {
  const [rows] = await db.query<Array<RowDataPacket & { total: number }>>(
    `
      SELECT
        (SELECT COUNT(*) FROM goods_receipt_items WHERE product_variant_id = ?)
        + (SELECT COUNT(*) FROM goods_issue_items WHERE product_variant_id = ?)
        + (SELECT COUNT(*) FROM stock_adjustment_items WHERE product_variant_id = ?)
        AS total
    `,
    [id, id, id],
  );

  return Number(rows[0]?.total ?? 0);
}

/** Số vị trí còn giữ hàng của sản phẩm. */
export async function countProductStock(id: number): Promise<number> {
  const [rows] = await db.query<Array<RowDataPacket & { total: number }>>(
    `
      SELECT COALESCE(SUM(quantity), 0) AS total
      FROM stock_locations
      WHERE product_variant_id = ?
    `,
    [id],
  );

  return Number(rows[0]?.total ?? 0);
}

export async function softDeleteProduct(id: number): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE product_variants pv JOIN products p ON p.id = pv.product_id
     SET pv.deleted_at = CURRENT_TIMESTAMP(3), pv.status = 'INACTIVE', p.deleted_at = CURRENT_TIMESTAMP(3), p.status = 'INACTIVE'
     WHERE pv.id = ? AND pv.deleted_at IS NULL`,
    [id],
  );
  return { affectedRows: result.affectedRows };
}
