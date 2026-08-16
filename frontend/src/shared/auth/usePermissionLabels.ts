import { useMemo } from 'react';

/**
 * Dịch mã quyền kỹ thuật (`stock_counts:approve`) sang nhãn tiếng Việt để hiển thị.
 *
 * Mã quyền phải giữ nguyên tiếng Anh vì backend dùng chính chuỗi đó làm khóa
 * trong `requirePermission()`; đây chỉ là lớp hiển thị, không được dùng nhãn
 * tiếng Việt để so khớp quyền ở bất kỳ đâu.
 *
 * Thứ tự ưu tiên khi tìm nhãn:
 *   1. Cột `name` trong bảng `permissions` (đã là tiếng Việt) nếu nơi gọi có
 *      truyền danh mục quyền vào — quyền mới thêm trong CSDL tự hiện đúng tên
 *      mà không phải sửa file này.
 *   2. Từ điển tĩnh bên dưới — dùng khi chỉ có mã quyền trong tay, ví dụ cột
 *      "Quyền hiện có" của bảng vai trò chỉ trả về danh sách mã.
 *   3. Ghép "nhóm + hành động" cho mã lạ, ví dụ `batches:delete` → "Lô hàng: Xóa".
 *   4. Cuối cùng mới trả về nguyên mã.
 */

/** Nhóm quyền (phần trước dấu hai chấm, khớp cột `permissions.module`). */
export const PERMISSION_MODULE_LABELS: Record<string, string> = {
    alerts: 'Cảnh báo tồn kho',
    auth: 'Tài khoản nhân viên',
    authorization: 'Phân quyền',
    batches: 'Lô hàng',
    catalog: 'Sản phẩm và danh mục',
    goods_issues: 'Phiếu xuất kho',
    goods_receipts: 'Phiếu nhập kho',
    locations: 'Vị trí lưu trữ',
    notifications: 'Thông báo',
    reports: 'Báo cáo',
    settings: 'Tham số hệ thống',
    stock: 'Tồn kho',
    stock_adjustments: 'Phiếu điều chỉnh tồn',
    stock_counts: 'Phiếu kiểm kê',
    stock_transfers: 'Phiếu chuyển kho',
    suppliers: 'Nhà cung cấp',
    users: 'Tài khoản nhân viên',
    warehouses: 'Kho hàng',
};

/** Hành động (phần sau dấu hai chấm), chỉ dùng khi ghép nhãn dự phòng. */
const PERMISSION_ACTION_LABELS: Record<string, string> = {
    approve: 'Duyệt',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    count: 'Ghi số đếm',
    create: 'Thêm mới',
    delete: 'Xóa',
    generate: 'Sinh dữ liệu',
    read: 'Xem',
    reject: 'Từ chối',
    reset_password: 'Đặt lại mật khẩu',
    resolve: 'Xử lý',
    reverse: 'Đảo phiếu',
    start: 'Bắt đầu',
    submit: 'Gửi duyệt',
    update: 'Sửa',
};

/**
 * Nhãn đầy đủ cho từng mã quyền đang được seed trong
 * `backend/warehouse_management_mysql.sql`. Giữ khớp với cột `permissions.name`.
 */
export const PERMISSION_LABELS: Record<string, string> = {
    'alerts:generate': 'Sinh cảnh báo tồn kho',
    'alerts:read': 'Đánh dấu đã đọc cảnh báo',
    'alerts:resolve': 'Xử lý cảnh báo',
    'authorization:read': 'Xem phân quyền',
    'authorization:update': 'Sửa phân quyền',
    'goods_issues:confirm': 'Xác nhận phiếu xuất',
    'goods_issues:reverse': 'Đảo phiếu xuất',
    'goods_receipts:confirm': 'Xác nhận phiếu nhập',
    'goods_receipts:reverse': 'Đảo phiếu nhập',
    'notifications:generate': 'Sinh thông báo',
    'notifications:read': 'Đánh dấu đã đọc thông báo',
    'settings:update': 'Sửa tham số hệ thống',
    'stock_adjustments:approve': 'Duyệt phiếu điều chỉnh',
    'stock_adjustments:cancel': 'Hủy phiếu điều chỉnh',
    'stock_adjustments:reject': 'Từ chối phiếu điều chỉnh',
    'stock_counts:approve': 'Duyệt phiếu kiểm kê',
    'stock_counts:count': 'Ghi số đếm kiểm kê',
    'stock_counts:create': 'Tạo phiếu kiểm kê',
    'stock_counts:start': 'Bắt đầu kiểm kê',
    'stock_counts:submit': 'Gửi duyệt kiểm kê',
    'stock_transfers:confirm': 'Xác nhận phiếu chuyển kho',
    'stock_transfers:reverse': 'Đảo phiếu chuyển kho',
    'users:create': 'Thêm nhân viên',
    'users:delete': 'Vô hiệu hóa nhân viên',
    'users:read': 'Xem nhân viên',
    'users:reset_password': 'Đặt lại mật khẩu nhân viên',
    'users:update': 'Sửa nhân viên',
    'warehouses:create': 'Thêm kho',
    'warehouses:delete': 'Xóa kho',
    'warehouses:update': 'Sửa kho',
    /** Quyền tổng, không nằm trong bảng `permissions` — do vai trò ADMIN suy ra. */
    '*': 'Toàn quyền hệ thống',
};

/** Vai trò hệ thống, cùng chỗ để nơi nào cần cũng lấy được một nguồn duy nhất. */
export const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    WAREHOUSE_MANAGER: 'Quản lý kho',
    STAFF: 'Nhân viên kho',
    AUDITOR: 'Kiểm soát viên',
};

/** Chỉ cần `code` và `name`; nơi gọi truyền vào danh sách quyền lấy từ backend. */
type PermissionCatalogItem = {
    code: string;
    name?: string | null;
    module?: string | null;
    description?: string | null;
};

export function permissionModuleLabel(moduleName: string): string {
    return PERMISSION_MODULE_LABELS[moduleName] ?? moduleName;
}

export function roleLabel(code: string, fallback = code): string {
    return ROLE_LABELS[code] ?? fallback;
}

/** Ghép nhãn cho mã chưa có trong từ điển, ví dụ `batches:delete` → "Lô hàng: Xóa". */
function composeLabel(code: string): string {
    const [moduleName, action] = code.split(':');

    if (!moduleName || !action) {
        return code;
    }

    const modulePart = PERMISSION_MODULE_LABELS[moduleName];
    const actionPart = PERMISSION_ACTION_LABELS[action];

    if (!modulePart || !actionPart) {
        return code;
    }

    return `${modulePart}: ${actionPart}`;
}

export function permissionLabel(code: string): string {
    return PERMISSION_LABELS[code] ?? composeLabel(code);
}

export function usePermissionLabels(catalog: PermissionCatalogItem[] = []) {
    const catalogByCode = useMemo(
        () => new Map(catalog.map((item) => [item.code, item])),
        [catalog],
    );

    return useMemo(
        () => ({
            /** Nhãn tiếng Việt của một mã quyền. Không bao giờ trả về chuỗi rỗng. */
            labelOf: (code: string): string =>
                catalogByCode.get(code)?.name || permissionLabel(code),

            /** Nhãn tiếng Việt của một nhóm quyền (`module`). */
            moduleLabelOf: permissionModuleLabel,

            /** Nhãn tiếng Việt của một vai trò. */
            roleLabelOf: roleLabel,

            /** Mô tả chi tiết từ CSDL, dùng cho tooltip. Có thể không có. */
            describe: (code: string): string | undefined =>
                catalogByCode.get(code)?.description ?? undefined,
        }),
        [catalogByCode],
    );
}
