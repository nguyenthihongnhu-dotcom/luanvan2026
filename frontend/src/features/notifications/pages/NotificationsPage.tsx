import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { useDateFormatter } from '@/shared/hooks';
import { notificationService } from '@/features/notifications/services/notificationService';
import type { NotificationItem } from '@/features/notifications/services/notificationService';

type ReadStatusFilter = 'ALL' | 'UNREAD' | 'READ';

export default function NotificationsPage() {
    const { formatDate } = useDateFormatter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReadStatusFilter>('ALL');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadNotifications(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setNotifications(await notificationService.listNotifications(search));
        } catch (err) {
            console.error(err);
            setError('Không tải được danh sách thông báo từ backend.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadNotifications('');
    }, []);

    const filteredNotifications = useMemo(() => {
        return notifications.filter((item) => {
            const isReadBool = Boolean(item.is_read);
            if (statusFilter === 'UNREAD' && isReadBool) return false;
            if (statusFilter === 'READ' && !isReadBool) return false;
            return true;
        });
    }, [notifications, statusFilter]);

    const unreadCount = useMemo(() => {
        return notifications.filter((n) => !n.is_read).length;
    }, [notifications]);

    async function handleMarkRead(id: number) {
        setIsProcessing(true);
        setError(null);
        try {
            await notificationService.markNotificationAsRead(id);
            await loadNotifications();
        } catch (err) {
            console.error(err);
            setError('Không thể cập nhật trạng thái thông báo.');
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleMarkAllRead() {
        setIsProcessing(true);
        setError(null);
        try {
            await notificationService.markAllNotificationsAsRead();
            await loadNotifications();
        } catch (err) {
            console.error(err);
            setError('Không thể đánh dấu tất cả thông báo là đã đọc.');
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleGenerateFromAlerts() {
        setIsProcessing(true);
        setError(null);
        try {
            const result = await notificationService.generateNotifications();
            await loadNotifications();
            alert(`Đã sinh thành công ${result.createdCount} thông báo từ cảnh báo.`);
        } catch (err) {
            console.error(err);
            setError('Không thể sinh thông báo từ cảnh báo.');
        } finally {
            setIsProcessing(false);
        }
    }

    const columns: ColumnProps<NotificationItem>[] = [
        {
            key: 'is_read',
            title: 'Trạng thái',
            className: 'w-24',
            render: (value) => (
                <span
                    className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                        value
                            ? 'border-gray-200 bg-gray-50 text-gray-500'
                            : 'border-pink-300 bg-pink-50 text-pink-700'
                    }`}
                >
                    {value ? 'Đã đọc' : 'Chưa đọc'}
                </span>
            ),
        },
        { key: 'title', title: 'Tiêu đề', className: 'font-semibold text-gray-900' },
        { key: 'message', title: 'Nội dung thông báo' },
        { key: 'type', title: 'Loại', className: 'text-xs text-gray-500' },
        {
            key: 'created_at',
            title: 'Thời gian',
            render: (value) => formatDate(String(value || '')),
        },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record) => {
                if (record.is_read) return <span className="text-xs text-gray-400">-</span>;
                return (
                    <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void handleMarkRead(record.id)}
                        className="rounded border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700 hover:bg-pink-100"
                    >
                        Đã đọc
                    </button>
                );
            },
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Thông báo hệ thống</h1>
                        <p className="text-sm text-gray-500">Xem và quản lý tất cả các thông báo cảnh báo và vận hành kho.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => void handleGenerateFromAlerts()}
                            className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            Quét cảnh báo
                        </button>
                        <button
                            type="button"
                            disabled={isProcessing || unreadCount === 0}
                            onClick={() => void handleMarkAllRead()}
                            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60"
                        >
                            Đánh dấu đọc tất cả
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Tổng thông báo</div>
                        <div className="text-xl font-bold text-gray-900">{notifications.length}</div>
                    </div>
                    <div className="rounded-md border border-pink-200 bg-pink-50 p-3 shadow-sm">
                        <div className="text-xs uppercase text-pink-700">Chưa đọc</div>
                        <div className="text-xl font-bold text-pink-800">{unreadCount}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Đã đọc</div>
                        <div className="text-xl font-bold text-gray-900">{notifications.length - unreadCount}</div>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo tiêu đề thông báo..."
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ReadStatusFilter)}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="UNREAD">Chưa đọc</option>
                            <option value="READ">Đã đọc</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => void loadNotifications()}
                            className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
                        >
                            Lọc
                        </button>
                    </div>
                </div>

                <Tablelayout columns={columns} dataSource={filteredNotifications} rowKey="id" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
