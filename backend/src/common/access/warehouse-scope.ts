import type { RowDataPacket } from 'mysql2/promise';
import { db } from '../../database/db';
import type { AuthUser } from '../../modules/auth/auth.model';

/**
 * Vai trò nhìn được toàn bộ kho. Quản trị và quản lý kho phải thấy tất cả để còn
 * điều phối giữa các kho; nhân viên thì chỉ thấy kho mình được gán.
 */
const UNRESTRICTED_ROLES = new Set(['ADMIN', 'WAREHOUSE_MANAGER', 'AUDITOR']);

export type WarehouseScope = {
  /** true nghĩa là không giới hạn kho nào. */
  unrestricted: boolean;
  /** Danh sách kho được gán; rỗng và không unrestricted nghĩa là chưa gán kho nào. */
  warehouseIds: number[];
};

export const UNRESTRICTED_SCOPE: WarehouseScope = {
  unrestricted: true,
  warehouseIds: [],
};

export async function findUserWarehouseIds(userId: number): Promise<number[]> {
  const [rows] = await db.query<
    Array<RowDataPacket & { warehouse_id: number }>
  >({
    sql: `
        SELECT warehouse_id
        FROM user_warehouses
        WHERE user_id = :userId
        ORDER BY is_primary DESC, warehouse_id
      `,
    values: { userId },
  });

  return rows.map((row) => Number(row.warehouse_id));
}

/**
 * Phạm vi kho của người đang đăng nhập. Đọc từ bảng user_warehouses, trừ các vai
 * trò quản trị vốn xem được mọi kho.
 */
export async function resolveWarehouseScope(
  user: AuthUser | undefined,
): Promise<WarehouseScope> {
  if (!user) {
    return { unrestricted: false, warehouseIds: [] };
  }

  if (UNRESTRICTED_ROLES.has(user.role)) {
    return UNRESTRICTED_SCOPE;
  }

  return {
    unrestricted: false,
    warehouseIds: await findUserWarehouseIds(Number(user.id)),
  };
}

/**
 * Suy ra kho từ một ô lưu trữ. Một số chứng từ cho phép bỏ trống warehouseId và
 * để backend tự suy từ vị trí dòng hàng đầu tiên, nên phần kiểm tra phạm vi cũng
 * phải suy được y như vậy, nếu không nhân viên gửi phiếu hợp lệ vẫn bị chặn.
 */
export async function findWarehouseIdByLocation(
  locationId: number | null | undefined,
): Promise<number | null> {
  if (!locationId) return null;

  const [rows] = await db.query<
    Array<RowDataPacket & { warehouse_id: number }>
  >({
    sql: `
        SELECT wz.warehouse_id
        FROM warehouse_locations wl
        JOIN warehouse_shelves ws ON ws.id = wl.shelf_id
        JOIN warehouse_zones wz ON wz.id = ws.zone_id
        WHERE wl.id = :locationId
        LIMIT 1
      `,
    values: { locationId },
  });

  return rows[0] ? Number(rows[0].warehouse_id) : null;
}

/** Người dùng có được phép thao tác trên kho này không. */
export function isWarehouseInScope(
  scope: WarehouseScope,
  warehouseId: number | null | undefined,
): boolean {
  if (scope.unrestricted) return true;
  if (!warehouseId) return false;
  return scope.warehouseIds.includes(Number(warehouseId));
}

/**
 * Sinh mệnh đề WHERE giới hạn theo kho cho một cột bất kỳ, và nạp tham số vào
 * `params` luôn để nơi gọi chỉ việc nối chuỗi.
 *
 * Trả về null khi không cần giới hạn. Người chưa được gán kho nào nhận về mệnh đề
 * luôn sai — thấy danh sách trống, thay vì thấy hết dữ liệu của mọi kho.
 */
export function warehouseScopeWhere(
  scope: WarehouseScope,
  column: string,
  params: Record<string, string | number | null>,
  options: { paramPrefix?: string; includeNull?: boolean } = {},
): string | null {
  if (scope.unrestricted) return null;

  const prefix = options.paramPrefix ?? 'scopeWarehouse';

  if (scope.warehouseIds.length === 0) {
    return options.includeNull ? `${column} IS NULL` : '1 = 0';
  }

  const placeholders = scope.warehouseIds.map((warehouseId, index) => {
    const key = `${prefix}${index}`;
    params[key] = warehouseId;
    return `:${key}`;
  });

  const inClause = `${column} IN (${placeholders.join(', ')})`;

  // Cảnh báo mức toàn hệ thống không gắn kho nào (warehouse_id NULL) vẫn phải
  // hiển thị cho mọi người, nếu không thì nhóm cảnh báo đó không ai thấy.
  return options.includeNull ? `(${inClause} OR ${column} IS NULL)` : inClause;
}
