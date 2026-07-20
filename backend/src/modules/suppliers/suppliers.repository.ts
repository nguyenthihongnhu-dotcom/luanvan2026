import type { ResultSetHeader } from 'mysql2';
import { db } from '../../database/db';
import type {
  MutationResult,
  QueryParams,
  SupplierInput,
  SuppliersFilters,
  SuppliersRow,
} from './suppliers.model';

const tableName = 'suppliers';

export async function findSuppliers(
  filters: SuppliersFilters,
): Promise<SuppliersRow[]> {
  const where: string[] = ['deleted_at IS NULL'];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(code LIKE :search OR name LIKE :search OR phone LIKE :search OR email LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const [rows] = await db.query<SuppliersRow[]>({
    sql: `SELECT * FROM ${tableName} WHERE ${where.join(' AND ')} ORDER BY id LIMIT 100`,
    values: params,
  });

  return rows;
}

export async function insertSupplier(
  input: SupplierInput,
): Promise<{ id: number }> {
  const code = input.code ?? `NCC-${Date.now()}`;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO suppliers (code, name, tax_code, contact_name, phone, email, address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      input.name,
      input.taxCode ?? null,
      input.contactName ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.address ?? null,
      input.status ?? 'ACTIVE',
    ],
  );

  return { id: result.insertId };
}

export async function updateSupplier(
  id: number,
  input: SupplierInput,
): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE suppliers
     SET code = ?, name = ?, tax_code = ?, contact_name = ?, phone = ?, email = ?, address = ?, status = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [
      input.code ?? `NCC-${id}`,
      input.name,
      input.taxCode ?? null,
      input.contactName ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.address ?? null,
      input.status ?? 'ACTIVE',
      id,
    ],
  );

  return { affectedRows: result.affectedRows };
}

export async function softDeleteSupplier(id: number): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE suppliers SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE' WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  return { affectedRows: result.affectedRows };
}
