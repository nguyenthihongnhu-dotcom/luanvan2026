import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    AppstoreOutlined,
    AuditOutlined,
    BarChartOutlined,
    BellOutlined,
    CheckOutlined,
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
    ScanOutlined,
    SettingOutlined,
    ShoppingOutlined,
    SwapOutlined,
    TagsOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { notificationService } from '@/features/notifications/services/notificationService';
import type { NotificationItem } from '@/features/notifications/services/notificationService';
import { getNotificationSocket } from '@/shared/services/socketClient';

const navbarGroups = [
    {
        name: 'Vận hành kho',
        items: [
            { label: 'Sơ đồ kho', path: '/locations', icon: PartitionOutlined },
            { label: 'Kho master', path: '/warehouses', icon: DatabaseOutlined },
            { label: 'Tồn kho', path: '/stock', icon: InboxOutlined },
            // { label: 'Nhập nhanh', path: '/quick-receive', icon: ScanOutlined },
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
            { label: 'Báo cáo', path: '/reports', icon: BarChartOutlined },
            { label: 'Phân quyền', path: '/authorization', icon: SafetyOutlined },
            { label: 'Nhân viên', path: '/employees', icon: UserOutlined },
            { label: 'Audit', path: '/audit-logs', icon: AuditOutlined },
            { label: 'File', path: '/attachments', icon: FileOutlined },
        ],
    },
];

const headerActions = [
    { label: 'Cảnh báo', path: '/alerts', icon: BellOutlined },
    { label: 'Thông báo', path: '/notifications', icon: NotificationOutlined, isNotification: true },
    { label: 'Cấu hình', path: '/settings', icon: SettingOutlined },
];

export default function Navbar(): ReactNode {
    const location = useLocation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const [isNotificationOpen, setNotificationOpen] = useState(false);
    const [isMarkingAllRead, setMarkingAllRead] = useState(false);
    const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const previewNotifications = notifications.slice(0, 5);

    async function fetchNotifications() {
        try {
            setNotifications(await notificationService.listNotifications());
        } catch {
            // Ignore silently if token missing.
        }
    }

    async function handleMarkAllRead() {
        setMarkingAllRead(true);
        try {
            await notificationService.markAllNotificationsAsRead();
            await fetchNotifications();
        } catch {
            // Ignore silently; the full notifications page shows detailed errors.
        } finally {
            setMarkingAllRead(false);
        }
    }

    async function handleMarkOneRead(id: number) {
        setMarkingNotificationId(id);
        try {
            await notificationService.markNotificationAsRead(id);
            await fetchNotifications();
        } catch {
            // Ignore silently; user can retry on the full notifications page.
        } finally {
            setMarkingNotificationId(null);
        }
    }

    function handleViewAllNotifications() {
        setNotificationOpen(false);
        navigate('/notifications');
    }

    useEffect(() => {
        let isMounted = true;
        async function fetchUnreadCount() {
            try {
                const list = await notificationService.listNotifications();
                if (isMounted) setNotifications(list);
            } catch {
                // Ignore silently if token missing.
            }
        }
        void fetchUnreadCount();

        // Socket.IO realtime listener
        const socket = getNotificationSocket();
        const handleNewNotification = (newNotif: NotificationItem) => {
            if (!isMounted) return;
            setNotifications((prev) => {
                if (prev.some((item) => item.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
            });
        };

        if (socket) {
            socket.on('notification:new', handleNewNotification);
        }

        // Fallback polling interval: 5 minutes instead of 30 seconds
        const interval = setInterval(() => { void fetchUnreadCount(); }, 300000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (socket) {
                socket.off('notification:new', handleNewNotification);
            }
        };
    }, []);

    useEffect(() => {
        setOpenGroup(null);
        setNotificationOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!openGroup && !isNotificationOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenGroup(null);
                setNotificationOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpenGroup(null);
                setNotificationOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openGroup, isNotificationOpen]);

    return (
        <nav ref={navRef} className="relative z-40 overflow-visible border-b border-slate-200 bg-white px-3 py-2 shadow-xs sm:px-4">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 overflow-visible">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-visible">
                    {navbarGroups.map((group) => {
                        const isOpen = openGroup === group.name;
                        const isGroupActive = group.items.some((item) => item.path === location.pathname);

                        return (
                            <div key={group.name} className="relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotificationOpen(false);
                                        setOpenGroup(isOpen ? null : group.name);
                                    }}
                                    aria-expanded={isOpen}
                                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${isOpen || isGroupActive
                                            ? 'bg-pink-50 text-pink-700'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <span>{group.name}</span>
                                    <DownOutlined className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-2 min-w-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                                        {group.items.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isActive
                                                            ? 'bg-pink-600 font-semibold text-white'
                                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <Icon className={`text-sm ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                                    <span className="flex-1">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                    {headerActions.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        if (item.isNotification) {
                            return (
                                <div key={item.path} className="relative">
                                    <button
                                        type="button"
                                        title={item.label}
                                        aria-expanded={isNotificationOpen}
                                        onClick={() => {
                                            setOpenGroup(null);
                                            setNotificationOpen((open) => !open);
                                        }}
                                        className={`relative flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors ${isNotificationOpen || isActive
                                                ? 'bg-pink-600 text-white shadow-sm shadow-pink-200'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <Icon />
                                        {unreadCount > 0 && (
                                            <span
                                                className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${isNotificationOpen || isActive ? 'bg-white text-pink-700' : 'bg-rose-600 text-white'
                                                    }`}
                                            >
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {isNotificationOpen && (
                                        <div className="absolute right-0 top-full z-50 mt-2 w-88 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">Thông báo</div>
                                                    <div className="text-xs text-slate-500">{unreadCount} chưa đọc</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleMarkAllRead()}
                                                    disabled={isMarkingAllRead || unreadCount === 0}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-pink-200 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <CheckOutlined className="text-[11px]" />
                                                    Đã đọc
                                                </button>
                                            </div>

                                            <div className="max-h-80 overflow-y-auto p-2">
                                                {previewNotifications.length === 0 ? (
                                                    <div className="px-3 py-6 text-center text-sm text-slate-500">Chưa có thông báo.</div>
                                                ) : (
                                                    previewNotifications.map((notification) => {
                                                        const isRead = Boolean(notification.is_read);
                                                        return (
                                                            <div key={notification.id} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                                                                <div className="flex items-start gap-2">
                                                                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isRead ? 'bg-slate-300' : 'bg-pink-600'}`} />
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="truncate text-xs font-bold text-slate-800">{notification.title}</div>
                                                                        <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</div>
                                                                    </div>
                                                                    {!isRead && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => void handleMarkOneRead(notification.id)}
                                                                            disabled={markingNotificationId === notification.id}
                                                                            className="shrink-0 rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-pink-200 hover:text-pink-600 disabled:opacity-50"
                                                                        >
                                                                            Đã đọc
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleViewAllNotifications}
                                                className="flex w-full items-center justify-center border-t border-slate-100 px-4 py-3 text-xs font-bold text-pink-600 transition hover:bg-pink-50"
                                            >
                                                Xem tất cả
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={item.label}
                                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-base transition-colors ${isActive
                                        ? 'bg-pink-600 text-white shadow-sm shadow-pink-200'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <Icon />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}