import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { auditLogService } from '@/features/audit-logs/services/auditLogService';
import { getHttpErrorMessage } from '@/shared/services/httpClient';
import type { AuditLog } from '@/features/audit-logs/services/auditLogService';

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

/**
 * Nhãn hành động. Phải phủ hết mã mà backend thật sự ghi ra — thiếu mã nào là
 * bảng hiện thẳng chuỗi tiếng Anh viết hoa giữa các dòng tiếng Việt.
 * Nguồn: các lời gọi `insertAuditLog({ action: ... })` trong backend/src/modules.
 */
const ACTION_LABELS: Record<string, string> = {
    CONFIRM: 'Xác nhận',
    APPROVE: 'Duyệt',
    CREATE: 'Tạo mới',
    REVERSE: 'Đảo phiếu',
    REJECT: 'Từ chối',
    CANCEL: 'Hủy phiếu',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    START: 'Bắt đầu kiểm kê',
    SUBMIT: 'Gửi duyệt',
    RESET_PASSWORD: 'Đặt lại mật khẩu',
    REQUEST_PASSWORD_RESET: 'Gửi yêu cầu quên mật khẩu',
    APPROVE_PASSWORD_RESET: 'Duyệt yêu cầu quên mật khẩu',
    REJECT_PASSWORD_RESET: 'Từ chối yêu cầu quên mật khẩu',
};

const MODULE_LABELS: Record<string, string> = {
    auth: 'Tài khoản nhân viên',
    users: 'Tài khoản nhân viên',
    authorization: 'Phân quyền',
    goods_receipts: 'Phiếu nhập kho',
    goods_issues: 'Phiếu xuất kho',
    stock_transfers: 'Phiếu điều chuyển',
    stock_adjustments: 'Phiếu điều chỉnh',
    stock_counts: 'Phiếu kiểm kê',
    warehouses: 'Kho hàng',
    locations: 'Vị trí kho',
    products: 'Sản phẩm',
    suppliers: 'Nhà cung cấp',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
    GOODS_RECEIPT: 'Phiếu nhập',
    GOODS_ISSUE: 'Phiếu xuất',
    STOCK_TRANSFER: 'Phiếu điều chuyển',
    STOCK_ADJUSTMENT: 'Phiếu điều chỉnh',
    STOCK_COUNT: 'Phiếu kiểm kê',
    USER: 'Nhân viên',
    WAREHOUSE: 'Kho hàng',
    PASSWORD_RESET_REQUEST: 'Yêu cầu quên mật khẩu',
};

function formatActionLabel(action: string): string {
    return ACTION_LABELS[action.trim().toUpperCase()] ?? action;
}

function formatModuleLabel(mod: string): string {
    return MODULE_LABELS[mod] ?? mod;
}

/**
 * Loại đối tượng và tên của nó tách làm hai dòng thay vì ghép một chuỗi: số
 * chứng từ có thể rất dài, và ghép thẳng dễ ra chuỗi lặp kiểu
 * "Nhân viên Nhân viên PHS" khi tên người trùng với nhãn loại.
 *
 * Ưu tiên tên/số chứng từ thật backend nối sang bảng gốc (`entity_name`); chỉ
 * rơi về `#id` khi bản ghi gốc đã bị xóa hoặc loại đối tượng chưa được nối.
 */
function renderEntityCell(record: AuditLog): ReactNode {
    if (!record.entity_type) return '-';

    const typeLabel = ENTITY_TYPE_LABELS[record.entity_type] ?? record.entity_type;
    const detail = record.entity_name ?? (record.entity_id ? `#${record.entity_id}` : null);

    return (
        <div className="leading-tight">
            <div>{typeLabel}</div>
            {detail && (
                <div className="mt-0.5 font-mono text-[11px] break-all text-gray-500" title={detail}>
                    {detail}
                </div>
            )}
        </div>
    );
}

export default function AuditLogsPage() {
    const [rows, setRows] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadRows(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setRows(await auditLogService.listAuditLogs(search));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không tải được audit log từ backend'));
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadRows(''); }, []);

    const columns: ColumnProps<AuditLog>[] = [
        { key: 'id', title: 'ID', className: 'font-semibold text-gray-900' },
        { key: 'action', title: 'Hành động', render: (value) => formatActionLabel(String(value || '')) },
        { key: 'module', title: 'Phân hệ (Module)', render: (value) => formatModuleLabel(String(value || '')) },
        { key: 'entity_type', title: 'Đối tượng (Entity)', className: 'whitespace-normal', render: (_, record) => renderEntityCell(record) },
        { key: 'user_id', title: 'Người dùng', render: (_, record) => record.user_full_name ? record.user_full_name : (record.user_id ? `#${record.user_id}` : 'Hệ thống') },
        { key: 'ip_address', title: 'Địa chỉ IP', render: (value) => String(value || '-') },
        { key: 'created_at', title: 'Thời gian', render: (value) => formatDateTime(String(value)) },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div><h1 className="text-xl font-bold text-gray-800">Audit log</h1><p className="text-sm text-gray-500">Truy vết thao tác hệ thống theo action/module/entity.</p></div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"><div className="flex gap-2"><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo hành động..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" /><button type="button" onClick={() => void loadRows()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lọc</button></div></div>
                <Tablelayout columns={columns} dataSource={rows} rowKey="id" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
