import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../../database/db';
import type {
  CreateLocationInput,
  CreateShelfInput,
  CreateZoneInput,
  CreateZoneResult,
  CreateShelfResult,
  CreateLocationResult,
  LocationFilters,
  LocationRow,
  LocationHistoryRow,
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
        COALESCE(SUM(sl.available_quantity), 0) AS available_quantity,
        GROUP_CONCAT(
          DISTINCT CASE
            WHEN sl.quantity > 0 THEN CONCAT(pv.sku, ' - ', COALESCE(pv.variant_name, p.name), ' (', CAST(sl.quantity AS CHAR), ')')
          END
          ORDER BY pv.sku SEPARATOR '; '
        ) AS stored_products
      FROM warehouse_locations wl
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      JOIN warehouses w ON w.id = wz.warehouse_id
      LEFT JOIN stock_locations sl ON sl.location_id = wl.id
      LEFT JOIN product_variants pv ON pv.id = sl.product_variant_id
      LEFT JOIN products p ON p.id = pv.product_id
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

export async function countShelfLocationsWithStock(
  shelfId: number,
): Promise<number> {
  const [rows] = await db.query<Array<RowDataPacket & { total: number }>>({
    sql: `
      SELECT COUNT(DISTINCT wl.id) AS total
      FROM warehouse_locations wl
      JOIN stock_locations sl ON sl.location_id = wl.id
      WHERE wl.shelf_id = :shelfId
        AND wl.deleted_at IS NULL
        AND (sl.quantity > 0 OR sl.reserved_quantity > 0)
    `,
    values: { shelfId } satisfies QueryParams,
  });

  return Number(rows[0]?.total ?? 0);
}

export async function countLayerLocationsWithStock(
  shelfId: number,
  layerNo: number,
): Promise<number> {
  const [rows] = await db.query<Array<RowDataPacket & { total: number }>>({
    sql: `
      SELECT COUNT(DISTINCT wl.id) AS total
      FROM warehouse_locations wl
      JOIN stock_locations sl ON sl.location_id = wl.id
      WHERE wl.shelf_id = :shelfId
        AND wl.layer_no = :layerNo
        AND wl.deleted_at IS NULL
        AND (sl.quantity > 0 OR sl.reserved_quantity > 0)
    `,
    values: { shelfId, layerNo } satisfies QueryParams,
  });

  return Number(rows[0]?.total ?? 0);
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

export async function insertShelf(
  input: CreateShelfInput,
): Promise<CreateShelfResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [zoneRows] = await connection.query<
      Array<RowDataPacket & { id: number }>
    >(
      `
        SELECT wz.id
        FROM warehouse_zones wz
        JOIN warehouses w ON w.id = wz.warehouse_id
        WHERE wz.code = ?
          AND wz.deleted_at IS NULL
          AND w.id = COALESCE(?, w.id)
        ORDER BY w.id
        LIMIT 1
      `,
      [input.zoneCode, input.warehouseId ?? null],
    );
    const zoneId = zoneRows[0]?.id;

    if (!zoneId) {
      throw new Error('ZONE_NOT_FOUND');
    }

    const [maxRows] = await connection.query<
      Array<
        RowDataPacket & { max_code: string | null; max_sort: number | null }
      >
    >(
      `SELECT MAX(code) AS max_code, MAX(sort_order) AS max_sort FROM warehouse_shelves WHERE zone_id = ? AND deleted_at IS NULL`,
      [zoneId],
    );
    const nextNumber = input.code
      ? Number(input.code.replace(/\D/g, '')) || 1
      : (Number(String(maxRows[0]?.max_code ?? '0').replace(/\D/g, '')) || 0) +
        1;
    const shelfCode = input.code ?? String(nextNumber).padStart(2, '0');
    const shelfName = input.name ?? `Kệ ${shelfCode}`;

    const [shelfResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO warehouse_shelves (zone_id, code, name, status, sort_order) VALUES (?, ?, ?, 'ACTIVE', ?)`,
      [zoneId, shelfCode, shelfName, (maxRows[0]?.max_sort ?? 0) + 1],
    );

    const [layerRows] = await connection.query<
      Array<RowDataPacket & { max_layer: number | null }>
    >(
      `
        SELECT MAX(wl.layer_no) AS max_layer
        FROM warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        WHERE ws.zone_id = ?
          AND wl.deleted_at IS NULL
      `,
      [zoneId],
    );
    const layerCount = input.layerCount ?? layerRows[0]?.max_layer ?? 3;

    for (let layerNo = 1; layerNo <= layerCount; layerNo += 1) {
      const layerCode = String(layerNo).padStart(2, '0');
      await connection.query(
        `INSERT INTO warehouse_locations (shelf_id, code, layer_no, name, location_type, status)
         VALUES (?, ?, ?, ?, 'STANDARD', 'ACTIVE')`,
        [
          shelfResult.insertId,
          `${input.zoneCode}-${shelfCode}-${layerCode}`,
          layerNo,
          `${shelfName} tầng ${layerCode}`,
        ],
      );
    }

    await connection.commit();
    return {
      id: shelfResult.insertId,
      code: shelfCode,
      createdLocationCount: layerCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function insertZone(
  input: CreateZoneInput,
): Promise<CreateZoneResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [warehouseRows] = await connection.query<
      Array<RowDataPacket & { id: number }>
    >(
      `SELECT id FROM warehouses WHERE id = COALESCE(?, id) AND deleted_at IS NULL ORDER BY id LIMIT 1`,
      [input.warehouseId ?? null],
    );
    const warehouseId = warehouseRows[0]?.id;

    if (!warehouseId) {
      throw new Error('WAREHOUSE_NOT_FOUND');
    }

    const [sortRows] = await connection.query<
      Array<RowDataPacket & { max_sort: number | null }>
    >(
      `SELECT MAX(sort_order) AS max_sort FROM warehouse_zones WHERE warehouse_id = ? AND deleted_at IS NULL`,
      [warehouseId],
    );

    const [zoneResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO warehouse_zones (warehouse_id, code, name, status, sort_order) VALUES (?, ?, ?, 'ACTIVE', ?)`,
      [
        warehouseId,
        input.code,
        input.name ?? `Khu ${input.code}`,
        (sortRows[0]?.max_sort ?? 0) + 1,
      ],
    );

    const shelfCount = input.shelfCount ?? 1;
    const layerCount = input.layerCount ?? 3;
    let createdLocationCount = 0;

    for (let shelfNo = 1; shelfNo <= shelfCount; shelfNo += 1) {
      const shelfCode = String(shelfNo).padStart(2, '0');
      const [shelfResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO warehouse_shelves (zone_id, code, name, status, sort_order) VALUES (?, ?, ?, 'ACTIVE', ?)`,
        [zoneResult.insertId, shelfCode, `Kệ ${shelfCode}`, shelfNo],
      );

      for (let layerNo = 1; layerNo <= layerCount; layerNo += 1) {
        const layerCode = String(layerNo).padStart(2, '0');
        await connection.query(
          `INSERT INTO warehouse_locations (shelf_id, code, layer_no, name, location_type, status)
           VALUES (?, ?, ?, ?, 'STANDARD', 'ACTIVE')`,
          [
            shelfResult.insertId,
            `${input.code}-${shelfCode}-${layerCode}`,
            layerNo,
            `Kệ ${shelfCode} tầng ${layerCode}`,
          ],
        );
        createdLocationCount += 1;
      }
    }

    await connection.commit();
    return {
      id: zoneResult.insertId,
      code: input.code,
      createdShelfCount: shelfCount,
      createdLocationCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reorderShelvesRepository(
  shelfIds: number[],
): Promise<MutationResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    let affectedRows = 0;

    for (const [index, shelfId] of shelfIds.entries()) {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE warehouse_shelves SET sort_order = ? WHERE id = ? AND deleted_at IS NULL`,
        [index + 1, shelfId],
      );
      affectedRows += result.affectedRows;
    }

    await connection.commit();
    return { affectedRows };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function findLocationHistory(
  locationId: number,
): Promise<LocationHistoryRow[]> {
  const [rows] = await db.query<LocationHistoryRow[]>({
    sql: `
      SELECT
        it.id,
        it.transaction_code,
        it.transaction_type,
        CASE
          WHEN it.destination_location_id = :locationId THEN 'IN'
          ELSE 'OUT'
        END AS direction,
        it.quantity,
        it.quantity_before,
        it.quantity_after,
        it.reference_type,
        it.reference_id,
        it.reason_code,
        it.note,
        it.created_at,
        pv.sku,
        p.name AS product_name,
        pv.variant_name AS variant_name,
        u.full_name AS performed_by_name
      FROM inventory_transactions it
      JOIN product_variants pv ON pv.id = it.product_variant_id
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN users u ON u.id = it.performed_by
      WHERE it.source_location_id = :locationId
         OR it.destination_location_id = :locationId
      ORDER BY it.created_at DESC, it.id DESC
      LIMIT 100
    `,
    values: { locationId } satisfies QueryParams,
  });

  return rows;
}
