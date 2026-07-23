import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { notificationService } from '@/features/notifications/services/notificationService';

const navbarGroups = [
    {
        name: 'Vận hành kho',
        items: [
            { label: 'Sơ đồ kho', path: '/locations' },
            { label: 'Kho master', path: '/warehouses' },
            { label: 'Tồn kho', path: '/stock' },
            { label: 'Log tồn', path: '/inventory-transactions' },
            { label: 'Lô hàng', path: '/batches' },
        ],
    },
    {
        name: 'Chứng từ',
        items: [
            { label: 'Giao dịch', path: '/transactions' },
            { label: 'Chuyển kho', path: '/transfers' },
            { label: 'Kiểm kê', path: '/stock-counts' },
            { label: 'Hàng hoá', path: '/products' },
            { label: 'Danh mục', path: '/categories' },
            { label: 'Đối tác', path: '/partners' },
        ],
    },
    {
        name: 'Quản trị',
        items: [
            { label: 'Cảnh báo', path: '/alerts' },
            { label: 'Thông báo', path: '/notifications', isNotification: true },
            { label: 'Báo cáo', path: '/reports' },
            { label: 'Phân quyền', path: '/authorization' },
            { label: 'Nhân viên', path: '/employees' },
            { label: 'Audit', path: '/audit-logs' },
            { label: 'File', path: '/attachments' },
            { label: 'Cấu hình', path: '/settings' },
        ],
    },
];

export default function Navbar(): ReactNode {
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;
        async function fetchUnreadCount() {
            try {
                const list = await notificationService.listNotifications();
                if (isMounted) {
                    setUnreadCount(list.filter((n) => !n.is_read).length);
                }
            } catch {
                // Ignore silently if token missing
            }
        }
        void fetchUnreadCount();
        const interval = setInterval(() => { void fetchUnreadCount(); }, 30000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <nav className="border-b border-slate-200 bg-white px-4 py-2.5 shadow-xs">
            <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 overflow-x-auto text-xs font-medium">
                    {navbarGroups.flatMap((group) => group.items).map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                                    isActive
                                        ? 'bg-pink-600 font-semibold text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <span>{item.label}</span>
                                {item.isNotification && unreadCount > 0 && (
                                    <span
                                        className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                                            isActive
                                                ? 'bg-white text-pink-700'
                                                : 'bg-rose-600 text-white'
                                        }`}
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
