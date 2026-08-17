import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import {
  UNRESTRICTED_SCOPE,
  warehouseScopeWhere,
} from '../../common/access/warehouse-scope';
import { db } from '../../database/db';
import type {
  CreateLocationInput,
  CreateLayerInput,
  CreateLayerResult,
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
  SyncLocationMatrixInput,
  SyncLocationMatrixResult,
  ZoneRow,
  UpdateZoneLayoutInput,
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

  const scopeWhere = warehouseScopeWhere(
    filters.warehouseScope ?? UNRESTRICTED_SCOPE,
    'w.id',
    params,
  );
  if (scopeWhere) where.push(scopeWhere);

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

/**
 * Đổi biệt danh của khu. Chỉ chạm cột `name` — cột `code` (A, B, C) là mã kỹ
 * thuật đã nằm trong mã từng ô lưu trữ (HCM01-A-A01-01) nên không đổi được ở đây.
 */
export async function renameZone(
  zoneId: number,
  name: string,
): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE warehouse_zones
      SET name = :name
      WHERE id = :zoneId
        AND deleted_at IS NULL
    `,
    values: { zoneId, name } satisfies QueryParams,
  });

  return { affectedRows: result.affectedRows };
}

export async function countZoneLocationsWithStock(
  zoneId: number,
): Promise<number> {
  const [rows] = await db.query<Array<RowDataPacket & { total: number }>>({
    sql: `
      SELECT COUNT(DISTINCT wl.id) AS total
      FROM warehouse_locations wl
      JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
      JOIN stock_locations sl ON sl.location_id = wl.id
      WHERE ws.zone_id = :zoneId
        AND ws.deleted_at IS NULL
        AND wl.deleted_at IS NULL
        AND (sl.quantity > 0 OR sl.reserved_quantity > 0)
    `,
    values: { zoneId } satisfies QueryParams,
  });

  return Number(rows[0]?.total ?? 0);
}

/**
 * Xóa mềm cả khu: ô lưu trữ, rồi kệ, rồi khu. Chỉ gọi sau khi đã xác nhận khu
 * không còn tồn — kiểm tra và xóa nằm chung một transaction để không có ai kịp
 * nhập hàng vào giữa hai bước.
 */
export async function softDeleteZoneTransaction(
  zoneId: number,
): Promise<{ deletedShelves: number; deletedLocations: number }> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [zoneRows] = await connection.query<
      Array<RowDataPacket & { id: number }>
    >(
      'SELECT id FROM warehouse_zones WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [zoneId],
    );

    if (!zoneRows[0]) {
      throw new Error('ZONE_NOT_FOUND');
    }

    const [stockRows] = await connection.query<
      Array<RowDataPacket & { total: number }>
    >(
      `
        SELECT COUNT(DISTINCT wl.id) AS total
        FROM warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        JOIN stock_locations sl ON sl.location_id = wl.id
        WHERE ws.zone_id = ?
          AND ws.deleted_at IS NULL
          AND wl.deleted_at IS NULL
          AND (sl.quantity > 0 OR sl.reserved_quantity > 0)
        FOR UPDATE
      `,
      [zoneId],
    );

    if (Number(stockRows[0]?.total ?? 0) > 0) {
      throw new Error('ZONE_NOT_EMPTY');
    }

    const [locationResult] = await connection.query<ResultSetHeader>(
      `
        UPDATE warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        SET wl.deleted_at = CURRENT_TIMESTAMP(3), wl.status = 'INACTIVE'
        WHERE ws.zone_id = ?
          AND wl.deleted_at IS NULL
      `,
      [zoneId],
    );

    const [shelfResult] = await connection.query<ResultSetHeader>(
      `
        UPDATE warehouse_shelves
        SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
        WHERE zone_id = ?
          AND deleted_at IS NULL
      `,
      [zoneId],
    );

    await connection.query(
      `
        UPDATE warehouse_zones
        SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
        WHERE id = ?
      `,
      [zoneId],
    );

    await connection.commit();

    return {
      deletedShelves: shelfResult.affectedRows,
      deletedLocations: locationResult.affectedRows,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [locationResult] = await connection.query<ResultSetHeader>(
      `
        UPDATE warehouse_locations
        SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
        WHERE shelf_id = ?
          AND deleted_at IS NULL
      `,
      [shelfId],
    );

    const [shelfResult] = await connection.query<ResultSetHeader>(
      `
        UPDATE warehouse_shelves
        SET deleted_at = CURRENT_TIMESTAMP(3), status = 'INACTIVE'
        WHERE id = ?
          AND deleted_at IS NULL
      `,
      [shelfId],
    );

    await connection.commit();

    return {
      affectedRows:
        (shelfResult.affectedRows || 0) + (locationResult.affectedRows || 0),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

type ShelfForMatrix = RowDataPacket & {
  id: number;
  code: string;
  name: string;
};

async function findZoneForWrite(
  connection: PoolConnection,
  input: { zoneCode: string; warehouseId?: number },
): Promise<{ id: number; code: string }> {
  // Mã khu chỉ duy nhất trong phạm vi một kho (uq_zone_code UNIQUE(warehouse_id, code)),
  // nên bắt buộc phải lọc theo kho. Trước đây dùng COALESCE(?, w.id) rồi ORDER BY w.id LIMIT 1:
  // khi client không gửi warehouseId thì mọi thao tác thêm kệ/tầng đều rơi vào kho có id nhỏ nhất,
  // gây ra hiện tượng thêm kệ ở kho này lại mọc sang kho khác.
  const [zoneRows] = await connection.query<
    Array<RowDataPacket & { id: number; code: string; warehouse_id: number }>
  >(
    input.warehouseId
      ? `
        SELECT wz.id, wz.code, wz.warehouse_id
        FROM warehouse_zones wz
        WHERE wz.code = ?
          AND wz.warehouse_id = ?
          AND wz.deleted_at IS NULL
        LIMIT 1
      `
      : `
        SELECT wz.id, wz.code, wz.warehouse_id
        FROM warehouse_zones wz
        JOIN warehouses w ON w.id = wz.warehouse_id
        WHERE wz.code = ?
          AND wz.deleted_at IS NULL
          AND w.deleted_at IS NULL
        LIMIT 2
      `,
    input.warehouseId ? [input.zoneCode, input.warehouseId] : [input.zoneCode],
  );

  // Không gửi warehouseId mà mã khu tồn tại ở nhiều kho thì phải báo lỗi,
  // không được đoán bừa một kho.
  if (!input.warehouseId && zoneRows.length > 1) {
    throw new Error('ZONE_AMBIGUOUS');
  }

  const zone = zoneRows[0];

  if (!zone) {
    throw new Error('ZONE_NOT_FOUND');
  }

  return zone;
}

async function getActiveShelvesByZone(
  connection: PoolConnection,
  zoneId: number,
): Promise<ShelfForMatrix[]> {
  const [shelfRows] = await connection.query<ShelfForMatrix[]>(
    `
      SELECT id, code, name
      FROM warehouse_shelves
      WHERE zone_id = ?
        AND deleted_at IS NULL
      ORDER BY sort_order, code
    `,
    [zoneId],
  );

  return shelfRows;
}

/**
 * Danh sách kệ của một khu, đọc thẳng từ `warehouse_shelves`.
 *
 * Trước đây frontend suy ra danh sách kệ từ các ô lưu trữ, nên kệ vừa tạo mà chưa
 * có ô nào — hoặc kệ bị xóa hết tầng — sẽ biến mất khỏi sơ đồ dù vẫn còn trong CSDL.
 */
export async function findShelvesByZone(
  warehouseId: number,
  zoneCode: string,
): Promise<Array<{ id: number; code: string; name: string }>> {
  const [rows] = await db.query<
    Array<RowDataPacket & { id: number; code: string; name: string }>
  >({
    sql: `
      SELECT ws.id, ws.code, ws.name
      FROM warehouse_shelves ws
      JOIN warehouse_zones wz ON wz.id = ws.zone_id
      WHERE wz.warehouse_id = :warehouseId
        AND wz.code = :zoneCode
        AND wz.deleted_at IS NULL
        AND ws.deleted_at IS NULL
      ORDER BY ws.sort_order, ws.code
    `,
    values: { warehouseId, zoneCode } satisfies QueryParams,
  });

  return rows;
}

/** Tiền tố kho dùng trong mã ô: `KHO-HCM-01` -> `HCM01`. */
export function warehouseCodePrefix(warehouseCode: string): string {
  return warehouseCode.replace(/^KHO-/i, '').replaceAll('-', '');
}

async function getWarehousePrefixByZone(
  connection: PoolConnection,
  zoneId: number,
): Promise<string> {
  const [rows] = await connection.query<
    Array<RowDataPacket & { code: string }>
  >(
    `
      SELECT w.code
      FROM warehouse_zones wz
      JOIN warehouses w ON w.id = wz.warehouse_id
      WHERE wz.id = ?
      LIMIT 1
    `,
    [zoneId],
  );

  const warehouseCode = rows[0]?.code;

  if (!warehouseCode) {
    throw new Error('ZONE_NOT_FOUND');
  }

  return warehouseCodePrefix(warehouseCode);
}

async function ensureLocationForShelfLayer(
  connection: PoolConnection,
  input: {
    warehousePrefix: string;
    zoneCode: string;
    shelfId: number;
    shelfCode: string;
    shelfName: string;
    layerNo: number;
  },
): Promise<number> {
  const layerCode = String(input.layerNo).padStart(2, '0');
  // Cột code là UNIQUE trên toàn bảng chứ không phải theo từng kho, nên mã bắt
  // buộc phải mang tiền tố kho. Thiếu nó thì hai kho cùng có khu A kệ A01 sẽ
  // sinh ra cùng một mã và lệnh đồng bộ ma trận của kho thứ hai sẽ vỡ vì trùng khoá.
  const locationCode = `${input.warehousePrefix}-${input.zoneCode}-${input.shelfCode}-${layerCode}`;
  const locationName = `${input.shelfName} tầng ${layerCode}`;
  const [existingRows] = await connection.query<
    Array<RowDataPacket & { id: number; deleted_at: Date | null }>
  >(
    `
      SELECT id, deleted_at
      FROM warehouse_locations
      WHERE shelf_id = ?
        AND layer_no = ?
      LIMIT 1
    `,
    [input.shelfId, input.layerNo],
  );
  const existing = existingRows[0];

  if (existing && existing.deleted_at === null) {
    return 0;
  }

  if (existing) {
    const [result] = await connection.query<ResultSetHeader>(
      `
        UPDATE warehouse_locations
        SET code = ?,
            name = ?,
            location_type = 'STANDARD',
            status = 'ACTIVE',
            deleted_at = NULL
        WHERE id = ?
      `,
      [locationCode, locationName, existing.id],
    );
    return result.affectedRows;
  }

  const [result] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO warehouse_locations (
        shelf_id,
        code,
        layer_no,
        name,
        location_type,
        status
      )
      VALUES (?, ?, ?, ?, 'STANDARD', 'ACTIVE')
    `,
    [input.shelfId, locationCode, input.layerNo, locationName],
  );

  return result.affectedRows;
}

async function ensureZoneLocationMatrix(
  connection: PoolConnection,
  input: { zoneId: number; zoneCode: string; layerCount: number },
): Promise<number> {
  const shelves = await getActiveShelvesByZone(connection, input.zoneId);
  const warehousePrefix = await getWarehousePrefixByZone(
    connection,
    input.zoneId,
  );
  let createdLocationCount = 0;

  for (const shelf of shelves) {
    for (let layerNo = 1; layerNo <= input.layerCount; layerNo += 1) {
      createdLocationCount += await ensureLocationForShelfLayer(connection, {
        warehousePrefix,
        zoneCode: input.zoneCode,
        shelfId: shelf.id,
        shelfCode: shelf.code,
        shelfName: shelf.name,
        layerNo,
      });
    }
  }

  return createdLocationCount;
}

export async function insertShelf(
  input: CreateShelfInput,
): Promise<CreateShelfResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const zone = await findZoneForWrite(connection, input);

    // Lấy số lớn nhất TRÍCH TỪ mã kệ, không phải MAX(code) theo chuỗi: khu có cả
    // mã kiểu 'A01' lẫn '04' thì so chuỗi cho ra 'A02' (chữ lớn hơn số), lấy phần
    // số ra là 2 rồi sinh '03' đè lên kệ đã có và vỡ uq_shelf_code.
    //
    // Cũng phải xét cả kệ đã xóa mềm, vì ràng buộc UNIQUE(zone_id, code) không
    // phân biệt kệ còn sống hay đã xóa.
    const [maxRows] = await connection.query<
      Array<
        RowDataPacket & { max_number: number | null; max_sort: number | null }
      >
    >(
      `
        SELECT
          MAX(CAST(NULLIF(REGEXP_REPLACE(code, '[^0-9]', ''), '') AS UNSIGNED))
            AS max_number,
          MAX(sort_order) AS max_sort
        FROM warehouse_shelves
        WHERE zone_id = ?
      `,
      [zone.id],
    );
    const nextNumber = input.code
      ? Number(input.code.replace(/\D/g, '')) || 1
      : Number(maxRows[0]?.max_number ?? 0) + 1;
    const shelfCode = input.code ?? String(nextNumber).padStart(2, '0');
    const shelfName = input.name ?? `Kệ ${shelfCode}`;

    // Mã trùng một kệ đã xóa mềm thì hồi sinh kệ đó thay vì vỡ ràng buộc; trùng
    // kệ đang sống thì báo lỗi nghiệp vụ rõ ràng.
    const [existingRows] = await connection.query<
      Array<RowDataPacket & { id: number; deleted_at: Date | null }>
    >(
      `SELECT id, deleted_at FROM warehouse_shelves WHERE zone_id = ? AND code = ? LIMIT 1`,
      [zone.id, shelfCode],
    );
    const existingShelf = existingRows[0];

    if (existingShelf && existingShelf.deleted_at === null) {
      throw new Error('SHELF_CODE_ALREADY_EXISTS');
    }

    const nextSortOrder = Number(maxRows[0]?.max_sort ?? 0) + 1;
    let shelfId: number;

    if (existingShelf) {
      await connection.query(
        `
          UPDATE warehouse_shelves
          SET name = ?, status = 'ACTIVE', sort_order = ?, deleted_at = NULL
          WHERE id = ?
        `,
        [shelfName, nextSortOrder, existingShelf.id],
      );
      shelfId = existingShelf.id;
    } else {
      const [shelfResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO warehouse_shelves (zone_id, code, name, status, sort_order) VALUES (?, ?, ?, 'ACTIVE', ?)`,
        [zone.id, shelfCode, shelfName, nextSortOrder],
      );
      shelfId = shelfResult.insertId;
    }

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
      [zone.id],
    );
    const layerCount = input.layerCount ?? layerRows[0]?.max_layer ?? 3;

    const createdLocationCount = await ensureZoneLocationMatrix(connection, {
      zoneId: zone.id,
      zoneCode: zone.code,
      layerCount,
    });

    await connection.commit();
    return {
      id: shelfId,
      code: shelfCode,
      createdLocationCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function insertLayer(
  input: CreateLayerInput,
): Promise<CreateLayerResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const zone = await findZoneForWrite(connection, input);
    const [layerRows] = await connection.query<
      Array<RowDataPacket & { max_layer: number | null }>
    >(
      `
        SELECT MAX(wl.layer_no) AS max_layer
        FROM warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        WHERE ws.zone_id = ?
          AND ws.deleted_at IS NULL
          AND wl.deleted_at IS NULL
      `,
      [zone.id],
    );
    const layerNo = input.layerNo ?? (layerRows[0]?.max_layer ?? 0) + 1;
    const createdLocationCount = await ensureZoneLocationMatrix(connection, {
      zoneId: zone.id,
      zoneCode: zone.code,
      layerCount: layerNo,
    });

    await connection.commit();
    return { layerNo, createdLocationCount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function syncLocationMatrixRepository(
  input: SyncLocationMatrixInput,
): Promise<SyncLocationMatrixResult> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const zone = await findZoneForWrite(connection, input);
    const [layerRows] = await connection.query<
      Array<RowDataPacket & { max_layer: number | null }>
    >(
      `
        SELECT MAX(wl.layer_no) AS max_layer
        FROM warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        WHERE ws.zone_id = ?
          AND ws.deleted_at IS NULL
          AND wl.deleted_at IS NULL
      `,
      [zone.id],
    );
    const layerCount = layerRows[0]?.max_layer ?? 0;
    const createdLocationCount =
      layerCount > 0
        ? await ensureZoneLocationMatrix(connection, {
            zoneId: zone.id,
            zoneCode: zone.code,
            layerCount,
          })
        : 0;

    await connection.commit();
    return { createdLocationCount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findZonesByWarehouse(
  warehouseId: number,
): Promise<ZoneRow[]> {
  // Đọc thẳng từ warehouse_zones chứ không suy ra từ warehouse_locations:
  // khu vừa tạo mà chưa có kệ/vị trí nào vẫn phải hiện trên mặt bằng.
  const [rows] = await db.query<ZoneRow[]>({
    sql: `
      SELECT
        wz.id,
        wz.warehouse_id,
        wz.code,
        wz.name,
        wz.status,
        wz.sort_order,
        wz.grid_row,
        wz.grid_col,
        wz.grid_size,
        wz.grid_orientation,
        COUNT(DISTINCT ws.id) AS shelf_count,
        COUNT(DISTINCT loc.id) AS location_count,
        COUNT(DISTINCT CASE WHEN loc.qty > 0 THEN loc.id END) AS occupied_count,
        -- Ô hết chỗ thật: bị đánh dấu FULL, hoặc tồn đã chạm sức chứa khai báo.
        -- Trước đây chỉ đếm cờ FULL nên giao diện phải suy "mọi ô có hàng = đầy",
        -- khiến khu chỉ có một ô vừa nhận vài món đã bị coi là hết chỗ.
        COUNT(DISTINCT CASE
          WHEN loc.status = 'FULL'
            OR (
              loc.capacity_control_enabled = 1
              AND loc.max_capacity IS NOT NULL
              AND loc.qty >= loc.max_capacity
            )
          THEN loc.id
        END) AS full_count
      FROM warehouse_zones wz
      LEFT JOIN warehouse_shelves ws
        ON ws.zone_id = wz.id AND ws.deleted_at IS NULL
      LEFT JOIN (
        -- Gom tồn về từng vị trí trước rồi mới join, nếu join thẳng stock_locations
        -- thì một vị trí chứa nhiều SKU sẽ bị đếm lặp.
        SELECT
          wl.id,
          wl.shelf_id,
          wl.status,
          wl.capacity_control_enabled,
          wl.max_capacity,
          COALESCE(SUM(sl.quantity), 0) AS qty
        FROM warehouse_locations wl
        LEFT JOIN stock_locations sl ON sl.location_id = wl.id
        WHERE wl.deleted_at IS NULL
        GROUP BY
          wl.id,
          wl.shelf_id,
          wl.status,
          wl.capacity_control_enabled,
          wl.max_capacity
      ) loc ON loc.shelf_id = ws.id
      WHERE wz.warehouse_id = :warehouseId
        AND wz.deleted_at IS NULL
      GROUP BY
        wz.id, wz.warehouse_id, wz.code, wz.name, wz.status,
        wz.sort_order, wz.grid_row, wz.grid_col, wz.grid_size, wz.grid_orientation
      ORDER BY wz.sort_order, wz.code
    `,
    values: { warehouseId } satisfies QueryParams,
  });

  return rows;
}

export async function updateZoneLayoutRepository(
  input: UpdateZoneLayoutInput,
): Promise<MutationResult> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE warehouse_zones
      SET grid_row = :gridRow,
          grid_col = :gridCol,
          grid_size = :gridSize,
          -- Không gửi hướng thì giữ nguyên hướng đang có, tránh việc kéo thả
          -- vô tình đặt lại hướng xếp kệ của khu về mặc định.
          grid_orientation = COALESCE(:gridOrientation, grid_orientation)
      WHERE id = :zoneId
        AND deleted_at IS NULL
    `,
    values: {
      zoneId: input.zoneId,
      gridRow: input.gridRow ?? null,
      gridCol: input.gridCol ?? null,
      gridSize: input.gridSize ?? null,
      gridOrientation: input.gridOrientation ?? null,
    } satisfies QueryParams,
  });

  if (result.affectedRows === 0) {
    throw new Error('ZONE_NOT_FOUND');
  }

  return { affectedRows: result.affectedRows };
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

    const [dupRows] = await connection.query<
      Array<RowDataPacket & { id: number; deleted_at: Date | null }>
    >(
      `SELECT id, deleted_at FROM warehouse_zones WHERE warehouse_id = ? AND code = ? LIMIT 1`,
      [warehouseId, input.code],
    );

    if (dupRows[0] && dupRows[0].deleted_at === null) {
      throw new Error('ZONE_CODE_EXISTS');
    }

    const [sortRows] = await connection.query<
      Array<RowDataPacket & { max_sort: number | null }>
    >(
      `SELECT MAX(sort_order) AS max_sort FROM warehouse_zones WHERE warehouse_id = ? AND deleted_at IS NULL`,
      [warehouseId],
    );

    const zoneName = input.name ?? `Khu ${input.code}`;
    const sortOrder = (sortRows[0]?.max_sort ?? 0) + 1;
    let zoneId: number;

    // Mã khu đã từng bị xóa mềm thì dùng lại bản ghi cũ, nếu không sẽ vướng
    // ràng buộc uq_zone_code UNIQUE(warehouse_id, code).
    if (dupRows[0]) {
      zoneId = dupRows[0].id;
      await connection.query(
        `UPDATE warehouse_zones
         SET name = ?, status = 'ACTIVE', sort_order = ?, deleted_at = NULL,
             grid_row = ?, grid_col = ?, grid_size = ?
         WHERE id = ?`,
        [
          zoneName,
          sortOrder,
          input.gridRow ?? null,
          input.gridCol ?? null,
          input.gridSize ?? null,
          zoneId,
        ],
      );
    } else {
      const [zoneResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO warehouse_zones (warehouse_id, code, name, status, sort_order, grid_row, grid_col, grid_size)
         VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
        [
          warehouseId,
          input.code,
          zoneName,
          sortOrder,
          input.gridRow ?? null,
          input.gridCol ?? null,
          input.gridSize ?? null,
        ],
      );
      zoneId = zoneResult.insertId;
    }

    const shelfCount = input.shelfCount ?? 1;
    const layerCount = input.layerCount ?? 3;

    for (let shelfNo = 1; shelfNo <= shelfCount; shelfNo += 1) {
      const shelfCode = String(shelfNo).padStart(2, '0');
      // Zone khôi phục từ bản xóa mềm có thể còn kệ cũ cùng mã, nên phải upsert
      // thay vì INSERT thẳng (vướng uq_shelf_code UNIQUE(zone_id, code)).
      await connection.query(
        `INSERT INTO warehouse_shelves (zone_id, code, name, status, sort_order)
         VALUES (?, ?, ?, 'ACTIVE', ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           status = 'ACTIVE',
           sort_order = VALUES(sort_order),
           deleted_at = NULL`,
        [zoneId, shelfCode, `Kệ ${shelfCode}`, shelfNo],
      );
    }

    const createdLocationCount = await ensureZoneLocationMatrix(connection, {
      zoneId,
      zoneCode: input.code,
      layerCount,
    });

    await connection.commit();
    return {
      id: zoneId,
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
