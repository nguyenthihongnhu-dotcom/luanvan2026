import { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { attachmentService } from '@/features/attachments/services/attachmentService';
import type { AttachmentItem } from '@/features/attachments/services/attachmentService';

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatSize(value: number | null): string {
    if (!value) return '-';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function AttachmentsPage() {
    const [rows, setRows] = useState<AttachmentItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadRows(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setRows(await attachmentService.listAttachments(search));
        } catch (err) {
            console.error(err);
            setError('Không tải được metadata file đính kèm từ backend.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadRows(''); }, []);

    const columns: ColumnProps<AttachmentItem>[] = [
        { key: 'file_name', title: 'Tên file', className: 'font-semibold text-gray-900' },
        { key: 'entity_type', title: 'Entity', render: (_, record) => `${record.entity_type} #${record.entity_id}` },
        { key: 'mime_type', title: 'Loại file', render: (value) => String(value || '-') },
        { key: 'file_size', title: 'Dung lượng', render: (value) => formatSize(value as number | null) },
        { key: 'uploaded_by', title: 'Người tải lên', render: (value) => `#${String(value)}` },
        { key: 'created_at', title: 'Thời gian', render: (value) => formatDateTime(String(value)) },
        { key: 'file_url', title: 'Liên kết', render: (value) => <a href={String(value)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-900">Mở file</a> },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div><h1 className="text-xl font-bold text-gray-800">File đính kèm</h1><p className="text-sm text-gray-500">Xem metadata file gắn với chứng từ hoặc entity nghiệp vụ.</p></div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"><div className="flex gap-2"><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo tên file..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" /><button type="button" onClick={() => void loadRows()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lọc</button></div></div>
                <Tablelayout columns={columns} dataSource={rows} rowKey="id" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
