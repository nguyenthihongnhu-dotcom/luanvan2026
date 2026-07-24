import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { auditLogService } from '@/features/audit-logs/services/auditLogService';
import { getHttpErrorMessage } from '@/shared/services/httpClient';
import type { AuditLog } from '@/features/audit-logs/services/auditLogService';

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
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
        { key: 'action', title: 'Hành động' },
        { key: 'module', title: 'Module' },
        { key: 'entity_type', title: 'Entity', render: (_, record) => record.entity_type ? `${record.entity_type} #${record.entity_id ?? '-'}` : '-' },
        { key: 'user_id', title: 'Người dùng', render: (value) => value ? `#${String(value)}` : 'Hệ thống' },
        { key: 'ip_address', title: 'IP', render: (value) => String(value || '-') },
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
