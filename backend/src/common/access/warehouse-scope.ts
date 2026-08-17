import type { RowDataPacket } from 'mysql2/promise';
import { HttpError } from '../http';
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
 * Chặn các màn dữ liệu không gắn kho (nhật ký thao tác chẳng hạn) cho những vai
 * trò vốn nhìn toàn hệ thống. Không có cột kho để lọc thì không thể cắt theo kho,
 * nên cách duy nhất còn lại là không cho nhân viên kho vào.
 */
export function requireWarehouseWideRole(
  req: { user?: AuthUser },
  _res: unknown,
  next: (error?: unknown) => void,
): void {
  if (!req.user || !UNRESTRICTED_ROLES.has(req.user.role)) {
    next(
      new HttpError(
        403,
        'Chỉ quản trị, quản lý kho và kiểm toán xem được dữ liệu toàn hệ thống này',
        'WAREHOUSE_WIDE_ROLE_REQUIRED',
      ),
    );
    return;
  }

  next();
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

/**
 * Cột kho của từng loại chứng từ. Danh sách cố định này vừa là bản đồ tra cứu vừa
 * là hàng rào: tên bảng và tên cột ghép vào SQL nên không được nhận chuỗi tự do.
 */
const DOCUMENT_WAREHOUSE_COLUMNS = {
  goods_receipts: ['warehouse_id'],
  goods_issues: ['warehouse_id'],
  stock_adjustments: ['warehouse_id'],
  stock_counts: ['warehouse_id'],
  stock_transfers: ['source_warehouse_id', 'destination_warehouse_id'],
} as const;

export type DocumentTable = keyof typeof DOCUMENT_WAREHOUSE_COLUMNS;

export async function findDocumentWarehouseIds(
  table: DocumentTable,
  documentId: number,
): Promise<number[]> {
  const columns = DOCUMENT_WAREHOUSE_COLUMNS[table];
  const [rows] = await db.query<RowDataPacket[]>({
    sql: `SELECT ${columns.join(', ')} FROM ${table} WHERE id = :documentId LIMIT 1`,
    values: { documentId },
  });

  const row = rows[0];
  if (!row) return [];

  return columns
    .map((column) => Number(row[column]))
    .filter((warehouseId) => Number.isFinite(warehouseId) && warehouseId > 0);
}

/**
 * Chặn thao tác trên chứng từ của kho mình không phụ trách. Xác nhận, đảo phiếu
 * hay duyệt đều làm thay đổi tồn thật, nên chỉ kiểm quyền là chưa đủ: quyền nói
 * "được làm việc này", phạm vi kho mới nói "được làm ở kho nào".
 *
 * Phiếu chuyển kho có hai đầu và cả hai đều bị tác động, nên phải phụ trách cả hai.
 */
export async function assertDocumentWarehouseInScope(
  user: AuthUser | undefined,
  table: DocumentTable,
  documentId: number,
): Promise<void> {
  const scope = await resolveWarehouseScope(user);
  if (scope.unrestricted) return;

  const warehouseIds = await findDocumentWarehouseIds(table, documentId);
  const allowed =
    warehouseIds.length > 0 &&
    warehouseIds.every((warehouseId) => isWarehouseInScope(scope, warehouseId));

  if (!allowed) {
    throw new HttpError(
      403,
      'Chứng từ này thuộc kho bạn không phụ trách',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }
}
