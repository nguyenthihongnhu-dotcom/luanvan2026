import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import { alertService } from "@/features/alerts/services/alertService";
import type { AlertSeverity, AlertStatus, AlertType, InventoryAlert, NotificationItem } from "@/features/alerts/services/alertService";
import { transferService, type CurrentStockItem, type WarehouseLocationOption } from "@/features/transfers/services/transferService";
import { userService, type User } from "@/features/staff/services/userService";

/**
 * Cảnh báo và thông báo nằm chung một danh sách: cùng là việc cần người vận hành
 * để mắt tới, tách hai tab chỉ khiến phải nhớ mở cả hai. Phân biệt bằng màu —
 * cảnh báo đỏ, thông báo xanh.
 */
type FeedKind = "ALERT" | "NOTIFICATION";

type FeedRow = {
    /** Id trùng nhau giữa hai bảng nên khóa dòng phải kèm loại. */
    key: string;
    kind: FeedKind;
    id: number;
    title: string;
    message: string;
    typeText: string;
    severity: AlertSeverity | null;
    statusText: string;
    statusBadgeClass: string;
    contextText: string;
    createdAt: string | null;
    /** Giữ bản ghi gốc để cột thao tác biết gọi API nào. */
    alert: InventoryAlert | null;
    notification: NotificationItem | null;
};

const kindMeta: Record<FeedKind, { label: string; badgeClass: string; barClass: string }> = {
    ALERT: {
        label: "Cảnh báo",
        badgeClass: "border-red-200 bg-red-50 text-red-700",
        barClass: "bg-red-500",
    },
    NOTIFICATION: {
        label: "Thông báo",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
        barClass: "bg-emerald-500",
    },
};

const statusOptions: Array<{ value: AlertStatus | ""; label: string }> = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "OPEN", label: "Đang mở" },
    { value: "READ", label: "Đã đọc" },
    { value: "RESOLVED", label: "Đã xử lý" },
];

/** Format ISO datetime hoặc null thành chuỗi ngày giờ vi-VN. Trả về "-" nếu value là null. */
function formatDateTime(value: string | null): string {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

/** Chuyển mã loại cảnh báo (LOW_STOCK, NEAR_EXPIRY...) thành nhãn tiếng Việt hiển thị. */
function alertTypeLabel(type: AlertType | string): string {
    const labels: Record<string, string> = {
        LOW_STOCK: "Tồn thấp",
        OUT_OF_STOCK: "Hết hàng",
        OVER_MAX_STOCK: "Vượt tồn tối đa",
        NEAR_EXPIRY: "Gần hết hạn",
        EXPIRED: "Đã hết hạn",
        LOCATION_NEAR_FULL: "Vị trí gần đầy",
        COUNT_VARIANCE: "Lệch kiểm kê",
        ABNORMAL_ADJUSTMENT: "Điều chỉnh bất thường",
        SECURITY: "Bảo mật",
    };
    return labels[type] ?? type;
}

/** Chuyển mức độ (INFO / WARNING / CRITICAL) thành nhãn tiếng Việt. */
function severityLabel(severity: AlertSeverity): string {
    const labels: Record<AlertSeverity, string> = {
        INFO: "Thông tin",
        WARNING: "Cảnh báo",
        CRITICAL: "Nghiêm trọng",
    };
    return labels[severity] ?? severity;
}

/** Trả về Tailwind CSS classes phù hợp với mức độ cảnh báo (để render badge màu). */
function severityClass(severity: AlertSeverity): string {
    const classes: Record<AlertSeverity, string> = {
        INFO: "border-blue-200 bg-blue-50 text-blue-700",
        WARNING: "border-yellow-200 bg-yellow-50 text-yellow-800",
        CRITICAL: "border-red-200 bg-red-50 text-red-700",
    };
    return classes[severity] ?? "border-gray-200 bg-gray-50 text-gray-700";
}

/** Chuyển mã trạng thái (OPEN / READ / RESOLVED) thành nhãn tiếng Việt. */
function statusLabel(status: AlertStatus): string {
    const labels: Record<AlertStatus, string> = {
        OPEN: "Đang mở",
        READ: "Đã đọc",
        RESOLVED: "Đã xử lý",
    };
    return labels[status] ?? status;
}

/** Trả về CSS classes phù hợp với trạng thái cảnh báo (để render badge màu). */
function statusClass(status: AlertStatus): string {
    const classes: Record<AlertStatus, string> = {
        OPEN: "border-pink-200 bg-pink-50 text-pink-700",
        READ: "border-gray-200 bg-gray-50 text-gray-700",
        RESOLVED: "border-green-200 bg-green-50 text-green-700",
    };
    return classes[status] ?? "border-gray-200 bg-gray-50 text-gray-700";
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
    const [stockItems, setStockItems] = useState<CurrentStockItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<AlertStatus | "">("OPEN");
    const [isLoading, setIsLoading] = useState(false);
    /** Đang chạy một thao tác trên dòng (đánh dấu đã đọc, xử lý) — khóa nút để khỏi bấm chồng. */
    const [isActing, setIsActing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Tải dữ liệu cảnh báo, thông báo, vị trí kho, tồn kho và user song song.
     * - `warehouseMap`, `variantMap`, `userMap` phụ thuộc vào dữ liệu này để render tên thay cho ID.
     * @param nextSearch - Từ khóa tìm kiếm (mặc định lấy từ searchTerm hiện tại).
     * @param nextStatus - Lọc theo trạng thái cảnh báo (mặc định lấy từ statusFilter hiện tại).
     */
    async function loadData(nextSearch = searchTerm, nextStatus = statusFilter) {
        setIsLoading(true);
        setError(null);
        try {
            const [alertRows, notificationRows, locationRows, stockRows, userRows] = await Promise.all([
                alertService.listAlerts({ search: nextSearch, status: nextStatus }),
                alertService.listNotifications({ search: nextSearch }),
                transferService.listLocationOptions().catch(() => []),
                transferService.listCurrentStock().catch(() => []),
                userService.listUsers().catch(() => []),
            ]);
            setAlerts(alertRows);
            setNotifications(notificationRows);
            setLocations(locationRows);
            setStockItems(stockRows);
            setUsers(userRows);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được cảnh báo/thông báo từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadData("", "OPEN"); }, []);

    /**
     * Map warehouseId → “Code - Tên kho”.
     * Nguồn dữ liệu: `locations` và `stockItems` để bảo đảm cover cả kho chưa có tồn.
     * Memo hóa theo `locations` và `stockItems`.
     */
    const warehouseMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const loc of locations) {
            if (loc.warehouse_id && loc.warehouse_name) {
                map.set(loc.warehouse_id, `${loc.warehouse_code ? `${loc.warehouse_code} - ` : ""}${loc.warehouse_name}`);
            }
        }
        for (const stock of stockItems) {
            if (stock.warehouse_id && stock.warehouse_name) {
                map.set(stock.warehouse_id, `${stock.warehouse_code ? `${stock.warehouse_code} - ` : ""}${stock.warehouse_name}`);
            }
        }
        return map;
    }, [locations, stockItems]);

    /**
     * Map productVariantId → “SKU - Tên sản phẩm (variant)”.
     * Memo hóa theo `stockItems`.
     */
    const variantMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const stock of stockItems) {
            if (stock.product_variant_id) {
                const variantText = stock.variant_name ? ` (${stock.variant_name})` : "";
                map.set(stock.product_variant_id, `${stock.sku} - ${stock.product_name}${variantText}`);
            }
        }
        return map;
    }, [stockItems]);

    /**
     * Map userId → “Họ Tên (MãNV)” để hiển thị người nhận thông báo.
     * Memo hóa theo `users`.
     */
    const userMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const u of users) {
            if (u.MaNguoiDung) {
                map.set(u.MaNguoiDung, `${u.HoTen}${u.MaNhanVien ? ` (${u.MaNhanVien})` : ""}`);
            }
        }
        return map;
    }, [users]);

    /**
     * Wrapper thực thi một async action với trạng thái loading/error/message.
     * Reload lại dữ liệu sau khi thành công.
     * @param action - Hàm async cần chạy.
     * @param successMessage - Thông báo hiển thị khi thành công.
     */
    async function runAction(action: () => Promise<void>, successMessage: string) {
        setIsActing(true);
        setError(null);
        setMessage(null);
        try {
            await action();
            setMessage(successMessage);
            await loadData();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không thực hiện được thao tác. Kiểm tra backend rồi thử lại."));
        } finally {
            setIsActing(false);
        }
    }

    const summary = useMemo(() => ({
        open: alerts.filter((item) => item.status === "OPEN").length,
        critical: alerts.filter((item) => item.severity === "CRITICAL").length,
        unread: notifications.filter((item) => !item.is_read).length,
    }), [alerts, notifications]);

    /** Trộn cảnh báo và thông báo thành một dòng thời gian chung, mới nhất lên trước. */
    const feedRows = useMemo<FeedRow[]>(() => {
        const alertRows: FeedRow[] = alerts.map((alert) => ({
            key: `alert-${alert.id}`,
            kind: "ALERT",
            id: alert.id,
            title: alert.title,
            message: alert.message,
            typeText: alertTypeLabel(alert.alert_type),
            severity: alert.severity,
            statusText: statusLabel(alert.status),
            statusBadgeClass: statusClass(alert.status),
            contextText: [
                alert.warehouse_id ? warehouseMap.get(alert.warehouse_id) || `Kho #${alert.warehouse_id}` : "",
                alert.product_variant_id ? variantMap.get(alert.product_variant_id) || `SKU #${alert.product_variant_id}` : "",
            ].filter(Boolean).join(" · ") || "Toàn hệ thống",
            createdAt: alert.created_at ?? null,
            alert,
            notification: null,
        }));

        const notificationRows: FeedRow[] = notifications.map((notification) => ({
            key: `notification-${notification.id}`,
            kind: "NOTIFICATION",
            id: notification.id,
            title: notification.title,
            message: notification.message,
            typeText: notification.type,
            severity: null,
            statusText: notification.is_read ? "Đã đọc" : "Chưa đọc",
            statusBadgeClass: notification.is_read
                ? "border-gray-200 bg-gray-50 text-gray-700"
                : "border-pink-200 bg-pink-50 text-pink-700",
            contextText: notification.user_id
                ? userMap.get(notification.user_id) || `Người dùng #${notification.user_id}`
                : "Hệ thống",
            createdAt: notification.created_at ?? null,
            alert: null,
            notification,
        }));

        return [...alertRows, ...notificationRows].sort((a, b) => {
            const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return right - left;
        });
    }, [alerts, notifications, warehouseMap, variantMap, userMap]);

    const feedColumns: ColumnProps<FeedRow>[] = [
        { key: "title", title: "Nội dung", render: (_, record) => (
            <div className="flex gap-2">
                <span aria-hidden className={`mt-0.5 w-1 shrink-0 rounded-full ${kindMeta[record.kind].barClass}`} />
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${kindMeta[record.kind].badgeClass}`}>
                            {kindMeta[record.kind].label}
                        </span>
                        <span className="font-semibold text-gray-900">{record.title}</span>
                    </div>
                    <div className="text-xs text-gray-500">{record.message}</div>
                </div>
            </div>
        ) },
        { key: "typeText", title: "Phân loại" },
        { key: "severity", title: "Mức độ", render: (_, record) => (
            record.severity
                ? <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${severityClass(record.severity)}`}>{severityLabel(record.severity)}</span>
                : <span className="text-xs text-gray-400">-</span>
        ) },
        { key: "statusText", title: "Trạng thái", render: (_, record) => (
            <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${record.statusBadgeClass}`}>{record.statusText}</span>
        ) },
        { key: "contextText", title: "Liên quan / Người nhận" },
        { key: "createdAt", title: "Thời gian", render: (value) => formatDateTime(value as string | null) },
        { key: "actions", title: "Thao tác", width: "140px", render: (_, record) => (
            <div className="flex flex-wrap gap-1">
                {record.alert && record.alert.status === "OPEN" && (
                    <button type="button" onClick={() => void runAction(() => alertService.markAlertRead(record.id), "Đã đánh dấu cảnh báo là đã đọc.")} disabled={isActing} className="btn-action btn-blue disabled:opacity-60">Đã đọc</button>
                )}
                {record.alert && record.alert.status !== "RESOLVED" && (
                    <button type="button" onClick={() => void runAction(() => alertService.resolveAlert(record.id), "Đã xử lý cảnh báo.")} disabled={isActing} className="btn-action btn-green disabled:opacity-60">Xử lý</button>
                )}
                {record.notification && !record.notification.is_read && (
                    <button type="button" onClick={() => void runAction(() => alertService.markNotificationRead(record.id), "Đã đánh dấu thông báo là đã đọc.")} disabled={isActing} className="btn-action btn-blue disabled:opacity-60">Đã đọc</button>
                )}
            </div>
        ) },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Cảnh báo & thông báo</h1>
                        <p className="text-sm text-gray-500">Theo dõi tồn thấp, hết hàng, gần hết hạn và thông báo vận hành.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-md border border-pink-200 bg-pink-50 px-3 py-2"><div className="font-bold text-pink-700">{summary.open}</div><div className="text-pink-600">Đang mở</div></div>
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2"><div className="font-bold text-red-700">{summary.critical}</div><div className="text-red-600">Nghiêm trọng</div></div>
                        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2"><div className="font-bold text-blue-700">{summary.unread}</div><div className="text-blue-600">Chưa đọc</div></div>
                    </div>
                </div>

                {message && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo tiêu đề..." className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AlertStatus | "")} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                            {statusOptions.map((option) => <option key={option.value || "ALL"} value={option.value}>{option.label}</option>)}
                        </select>
                        <button type="button" onClick={() => void loadData()} disabled={isLoading} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isLoading ? "Đang tải" : "Lọc"}</button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-red-500" />Cảnh báo tồn kho</span>
                        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />Thông báo gửi tới người dùng</span>
                        <span className="text-gray-400">Cả hai được sinh tự động sau mỗi lần tồn kho thay đổi, không cần bấm tay.</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">Bộ lọc trạng thái áp cho cảnh báo; thông báo luôn hiển thị theo từ khóa tìm kiếm.</p>
                </div>

                <Tablelayout columns={feedColumns} dataSource={feedRows} rowKey="key" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
