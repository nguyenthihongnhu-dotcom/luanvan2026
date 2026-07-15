import type { ResultSetHeader } from 'mysql2';
import { db } from '../../database/db';
import type {
  CreateLocationInput,
  CreateLocationResult,
  LocationFilters,
  LocationRow,
  MutationResult,
  QueryParams,
} from './location.model';

export async function findLocations(
  filters: LocationFilters,
): Promise<LocationRow[]> {
  const where: string[] = ['wl.deleted_at IS NULL'];
  const params: QueryParams = {};

  if (filters.warehouseId) {
    where.push('w.id = :warehouseId');
    params.warehouseId = filters.warehouseId;
  }

  if (filters.status) {
    where.push('wl.status = :status');
    params.status = filters.status;
  }

  const [rows] = await db.query<LocationRow[]>({
    sql: `
      SELECT
        wl.id,
        wl.code,
        wl.name,
        wl.layer_no,
        wl.location_type,
        wl.status,
        w.id AS warehouse_id,
        w.code AS warehouse_code,
        w.name AS warehouse_name,
        wz.id AS zone_id,
        wz.code AS zone_code,
        wz.name AS zone_name,
        ws.id AS shelf_id,
        ws.code AS shelf_code,
        ws.name AS shelf_name,
        COALESCE(SUM(sl.quantity), 0) AS current_quantity,
        COALESCE(SUM(sl.available_quantity), 0) AS available_quantity
      FROM warehouse_locations wl
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      JOIN warehouses w ON w.id = wz.warehouse_id
      LEFT JOIN stock_locations sl ON sl.location_id = wl.id
      WHERE ${where.join(' AND ')}
      GROUP BY
        wl.id,
        wl.code,
        wl.name,
        wl.layer_no,
        wl.location_type,
        wl.status,
        w.id,
        w.code,
        w.name,
        wz.id,
        wz.code,
        wz.name,
        ws.id,
        ws.code,
        ws.name
      ORDER BY w.code, wz.sort_order, ws.sort_order, wl.layer_no, wl.code
    `,
    values: params,
  });

  return rows;
}

export async function insertLocation(
  input: CreateLocationInput,
): Promise<CreateLocationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      INSERT INTO warehouse_locations (
        shelf_id,
        code,
        layer_no,
        name,
        location_type,
        max_capacity,
        notes
      )
      VALUES (
        :shelfId,
        :code,
        :layerNo,
        :name,
        :locationType,
        :maxCapacity,
        :notes
      )
    `,
    values: {
      shelfId: input.shelfId,
      code: input.code,
      layerNo: input.layerNo,
      name: input.name ?? null,
      locationType: input.locationType ?? 'STANDARD',
      maxCapacity: input.maxCapacity ?? null,
      notes: input.notes ?? null,
    } satisfies QueryParams,
  });

  return { id: result.insertId };
}

export async function softDeleteLocationsByShelfId(
  shelfId: number,
): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE warehouse_locations
      SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
      WHERE shelf_id = :shelfId
        AND deleted_at IS NULL
    `,
    values: { shelfId } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}

export async function softDeleteLocationByLayer(
  shelfId: number,
  layerNo: number,
): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE warehouse_locations
      SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
      WHERE shelf_id = :shelfId
        AND layer_no = :layerNo
        AND deleted_at IS NULL
    `,
    values: { shelfId, layerNo } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}
