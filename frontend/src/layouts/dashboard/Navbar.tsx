import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    AppstoreOutlined,
    AuditOutlined,
    BarChartOutlined,
    BellOutlined,
    DatabaseOutlined,
    DownOutlined,
    FileOutlined,
    FileSearchOutlined,
    HistoryOutlined,
    InboxOutlined,
    NotificationOutlined,
    PartitionOutlined,
    RetweetOutlined,
    SafetyOutlined,
    SettingOutlined,
    ShoppingOutlined,
    SwapOutlined,
    TagsOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { notificationService } from '@/features/notifications/services/notificationService';

const navbarGroups = [
    {
        name: 'Vận hành kho',
        items: [
            { label: 'Sơ đồ kho', path: '/locations', icon: PartitionOutlined },
            { label: 'Kho master', path: '/warehouses', icon: DatabaseOutlined },
            { label: 'Tồn kho', path: '/stock', icon: InboxOutlined },
            { label: 'Log tồn', path: '/inventory-transactions', icon: HistoryOutlined },
            { label: 'Lô hàng', path: '/batches', icon: TagsOutlined },
        ],
    },
    {
        name: 'Chứng từ',
        items: [
            { label: 'Giao dịch', path: '/transactions', icon: SwapOutlined },
            { label: 'Chuyển kho', path: '/transfers', icon: RetweetOutlined },
            { label: 'Kiểm kê', path: '/stock-counts', icon: FileSearchOutlined },
            { label: 'Hàng hoá', path: '/products', icon: ShoppingOutlined },
            { label: 'Danh mục', path: '/categories', icon: AppstoreOutlined },
            { label: 'Đối tác', path: '/partners', icon: TeamOutlined },
        ],
    },
    {
        name: 'Quản trị',
        items: [
            { label: 'Cảnh báo', path: '/alerts', icon: BellOutlined },
            { label: 'Thông báo', path: '/notifications', icon: NotificationOutlined, isNotification: true },
            { label: 'Báo cáo', path: '/reports', icon: BarChartOutlined },
            { label: 'Phân quyền', path: '/authorization', icon: SafetyOutlined },
            { label: 'Nhân viên', path: '/employees', icon: UserOutlined },
            { label: 'Audit', path: '/audit-logs', icon: AuditOutlined },
            { label: 'File', path: '/attachments', icon: FileOutlined },
            { label: 'Cấu hình', path: '/settings', icon: SettingOutlined },
        ],
    },
];

export default function Navbar(): ReactNode {
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const navRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        setOpenGroup(null);
    }, [location.pathname]);

    useEffect(() => {
        if (!openGroup) return;

        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenGroup(null);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpenGroup(null);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openGroup]);

    return (
        <nav ref={navRef} className="relative border-b border-slate-200 bg-white px-4 py-2 shadow-xs">
            <div className="mx-auto flex max-w-[1400px] items-center gap-1">
                {navbarGroups.map((group) => {
                    const isOpen = openGroup === group.name;
                    const isGroupActive = group.items.some((item) => item.path === location.pathname);
                    const groupHasUnread = group.items.some((item) => item.isNotification) && unreadCount > 0;

                    return (
                        <div key={group.name} className="relative">
                            <button
                                type="button"
                                onClick={() => setOpenGroup(isOpen ? null : group.name)}
                                aria-expanded={isOpen}
                                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                                    isOpen || isGroupActive
                                        ? 'bg-pink-50 text-pink-700'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <span>{group.name}</span>
                                {groupHasUnread && !isOpen && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" aria-hidden="true" />
                                )}
                                <DownOutlined className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isOpen && (
                                <div className="absolute left-0 top-full z-20 mt-2 min-w-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                    {group.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                                    isActive
                                                        ? 'bg-pink-600 font-semibold text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                <Icon className={`text-sm ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                                <span className="flex-1">{item.label}</span>
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
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
