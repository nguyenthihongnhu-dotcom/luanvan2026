import type { ResultSetHeader } from 'mysql2';
import { db } from '../../database/db';
import type {
  QueryParams,
  WarehouseInput,
  WarehouseMutationResult,
  WarehousesFilters,
  WarehousesRow,
} from './warehouses.model';

const tableName = 'warehouses';

function optionalValue(
  value: string | number | undefined,
): string | number | null {
  return value ?? null;
}

export async function findWarehouses(
  filters: WarehousesFilters,
): Promise<WarehousesRow[]> {
  const where: string[] = ['deleted_at IS NULL'];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push(
      '(code LIKE :search OR name LIKE :search OR address_line LIKE :search)',
    );
    params.search = `%${filters.search}%`;
  }

  if (filters.status) {
    where.push('status = :status');
    params.status = filters.status;
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [rows] = await db.query<WarehousesRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} ORDER BY id DESC LIMIT 100`,
    values: params,
  });

  return rows;
}

import { insertZone } from '../locations/locations.repository';

export async function createWarehouseRepository(
  input: WarehouseInput,
): Promise<WarehouseMutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      INSERT INTO ${tableName} (
        code,
        name,
        address_line,
        ward,
        district,
        province,
        manager_user_id,
        status,
        description
      )
      VALUES (
        :code,
        :name,
        :addressLine,
        :ward,
        :district,
        :province,
        :managerUserId,
        :status,
        :description
      )
    `,
    values: {
      code: input.code,
      name: input.name,
      addressLine: optionalValue(input.addressLine),
      ward: optionalValue(input.ward),
      district: optionalValue(input.district),
      province: optionalValue(input.province),
      managerUserId: optionalValue(input.managerUserId),
      status: input.status,
      description: optionalValue(input.description),
    },
  });

  if (result.insertId) {
    try {
      await insertZone({
        warehouseId: result.insertId,
        code: 'A',
        name: 'Khu A - Tiêu chuẩn',
        shelfCount: 4,
        layerCount: 4,
      });
      await insertZone({
        warehouseId: result.insertId,
        code: 'B',
        name: 'Khu B - Hàng nặng',
        shelfCount: 4,
        layerCount: 4,
      });
    } catch (err) {
      console.error(
        'Failed to initialize default warehouse zones layout:',
        err,
      );
    }
  }

  return { affectedRows: result.affectedRows, insertId: result.insertId };
}

export async function updateWarehouseRepository(
  id: number,
  input: WarehouseInput,
): Promise<number> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE ${tableName}
      SET
        code = :code,
        name = :name,
        address_line = :addressLine,
        ward = :ward,
        district = :district,
        province = :province,
        manager_user_id = :managerUserId,
        status = :status,
        description = :description
      WHERE id = :id AND deleted_at IS NULL
    `,
    values: {
      id,
      code: input.code,
      name: input.name,
      addressLine: optionalValue(input.addressLine),
      ward: optionalValue(input.ward),
      district: optionalValue(input.district),
      province: optionalValue(input.province),
      managerUserId: optionalValue(input.managerUserId),
      status: input.status,
      description: optionalValue(input.description),
    },
  });

  return result.affectedRows;
}

export async function deleteWarehouseRepository(id: number): Promise<number> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE ${tableName}
      SET status = 'INACTIVE', deleted_at = CURRENT_TIMESTAMP(3)
      WHERE id = :id AND deleted_at IS NULL
    `,
    values: { id },
  });

  return result.affectedRows;
}
