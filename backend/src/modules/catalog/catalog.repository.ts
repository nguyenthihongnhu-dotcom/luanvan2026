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
        pv.min_stock_level, COALESCE(SUM(sl.quantity), 0) AS stock,
        MIN(pb.expiry_date) AS expiry_date
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_locations sl ON sl.product_variant_id = pv.id
      LEFT JOIN product_batches pb ON pb.id = sl.batch_id
      WHERE ${where.join(' AND ')}
      GROUP BY pv.id, pv.sku, pv.variant_name, p.name, c.name, pv.min_stock_level
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
    if ((input.stock ?? 0) > 0) {
      const [locationRows] = await connection.query<IdRow[]>(
        `SELECT id FROM warehouse_locations WHERE deleted_at IS NULL AND status = 'ACTIVE' ORDER BY id LIMIT 1`,
      );
      const locationId = locationRows[0]?.id;
      if (locationId) {
        let batchId: number | null = null;
        if (input.expiryDate) {
          const [batchResult] = await connection.query<ResultSetHeader>(
            `INSERT INTO product_batches (product_variant_id, lot_number, expiry_date, received_date, status) VALUES (?, ?, ?, CURRENT_DATE, 'ACTIVE')`,
            [
              variantResult.insertId,
              `LOT-${input.sku}-${Date.now()}`,
              input.expiryDate,
            ],
          );
          batchId = batchResult.insertId;
        }
        await connection.query(
          `INSERT INTO stock_locations (product_variant_id, location_id, batch_id, quantity) VALUES (?, ?, ?, ?)`,
          [variantResult.insertId, locationId, batchId, input.stock ?? 0],
        );
      }
    }
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
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE product_variants pv JOIN products p ON p.id = pv.product_id
     SET pv.sku = ?, pv.variant_name = ?, pv.min_stock_level = ?, p.name = ?, p.category_id = ?
     WHERE pv.id = ? AND pv.deleted_at IS NULL`,
    [input.sku, input.name, input.minStock ?? 0, input.name, categoryId, id],
  );
  return { affectedRows: result.affectedRows };
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
