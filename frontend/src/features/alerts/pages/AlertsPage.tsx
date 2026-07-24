import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import { alertService } from "@/features/alerts/services/alertService";
import type { AlertSeverity, AlertStatus, AlertType, InventoryAlert, NotificationItem } from "@/features/alerts/services/alertService";

type ActiveTab = "alerts" | "notifications";

const statusOptions: Array<{ value: AlertStatus | ""; label: string }> = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "OPEN", label: "Đang mở" },
    { value: "READ", label: "Đã đọc" },
    { value: "RESOLVED", label: "Đã xử lý" },
];

function formatDateTime(value: string | null): string {
    if (!value) return "-";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

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

function severityLabel(severity: AlertSeverity): string {
    const labels: Record<AlertSeverity, string> = {
        INFO: "Thông tin",
        WARNING: "Cảnh báo",
        CRITICAL: "Nghiêm trọng",
    };
    return labels[severity] ?? severity;
}

function severityClass(severity: AlertSeverity): string {
    const classes: Record<AlertSeverity, string> = {
        INFO: "border-blue-200 bg-blue-50 text-blue-700",
        WARNING: "border-yellow-200 bg-yellow-50 text-yellow-800",
        CRITICAL: "border-red-200 bg-red-50 text-red-700",
    };
    return classes[severity] ?? "border-gray-200 bg-gray-50 text-gray-700";
}

function statusLabel(status: AlertStatus): string {
    const labels: Record<AlertStatus, string> = {
        OPEN: "Đang mở",
        READ: "Đã đọc",
        RESOLVED: "Đã xử lý",
    };
    return labels[status] ?? status;
}

function statusClass(status: AlertStatus): string {
    const classes: Record<AlertStatus, string> = {
        OPEN: "border-pink-200 bg-pink-50 text-pink-700",
        READ: "border-gray-200 bg-gray-50 text-gray-700",
        RESOLVED: "border-green-200 bg-green-50 text-green-700",
    };
    return classes[status] ?? "border-gray-200 bg-gray-50 text-gray-700";
}

export default function AlertsPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("alerts");
    const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<AlertStatus | "">("OPEN");
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function loadData(nextSearch = searchTerm, nextStatus = statusFilter) {
        setIsLoading(true);
        setError(null);
        try {
            const [alertRows, notificationRows] = await Promise.all([
                alertService.listAlerts({ search: nextSearch, status: nextStatus }),
                alertService.listNotifications({ search: nextSearch }),
            ]);
            setAlerts(alertRows);
            setNotifications(notificationRows);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được cảnh báo/thông báo từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadData("", "OPEN"); }, []);

    async function runAction(action: () => Promise<void>, successMessage: string) {
        setIsGenerating(true);
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
            setIsGenerating(false);
        }
    }

    async function handleGenerateAlerts() {
        await runAction(async () => {
            const result = await alertService.generateAlerts();
            setMessage(`Đã sinh ${result.createdCount.toLocaleString("vi-VN")} cảnh báo mới.`);
        }, "Đã sinh cảnh báo.");
    }

    async function handleGenerateNotifications() {
        await runAction(async () => {
            const result = await alertService.generateNotifications();
            setMessage(`Đã sinh ${result.createdCount.toLocaleString("vi-VN")} thông báo mới.`);
        }, "Đã sinh thông báo.");
    }

    const summary = useMemo(() => ({
        open: alerts.filter((item) => item.status === "OPEN").length,
        critical: alerts.filter((item) => item.severity === "CRITICAL").length,
        unread: notifications.filter((item) => !item.is_read).length,
    }), [alerts, notifications]);

    const alertColumns: ColumnProps<InventoryAlert>[] = [
        { key: "title", title: "Cảnh báo", className: "font-semibold text-gray-900", render: (_, record) => (
            <div>
                <div className="font-semibold text-gray-900">{record.title}</div>
                <div className="text-xs text-gray-500">{record.message}</div>
            </div>
        ) },
        { key: "alert_type", title: "Loại", render: (value) => alertTypeLabel(String(value)) },
        { key: "severity", title: "Mức độ", render: (value) => {
            const severity = value as AlertSeverity;
            return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${severityClass(severity)}`}>{severityLabel(severity)}</span>;
        } },
        { key: "status", title: "Trạng thái", render: (value) => {
            const status = value as AlertStatus;
            return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusClass(status)}`}>{statusLabel(status)}</span>;
        } },
        { key: "warehouse_id", title: "Kho", render: (value) => value ? `#${String(value)}` : "-" },
        { key: "product_variant_id", title: "Variant", render: (value) => value ? `#${String(value)}` : "-" },
        { key: "created_at", title: "Thời gian", render: (value) => formatDateTime(value as string) },
        { key: "actions", title: "Thao tác", render: (_, record) => (
            <div className="flex flex-wrap gap-2">
                {record.status === "OPEN" && <button type="button" onClick={() => void runAction(() => alertService.markAlertRead(record.id), "Đã đánh dấu cảnh báo là đã đọc.")} className="text-xs font-medium text-blue-600 hover:text-blue-900">Đã đọc</button>}
                {record.status !== "RESOLVED" && <button type="button" onClick={() => void runAction(() => alertService.resolveAlert(record.id), "Đã xử lý cảnh báo.")} className="text-xs font-medium text-green-700 hover:text-green-900">Xử lý</button>}
            </div>
        ) },
    ];

    const notificationColumns: ColumnProps<NotificationItem>[] = [
        { key: "title", title: "Thông báo", className: "font-semibold text-gray-900", render: (_, record) => (
            <div>
                <div className="font-semibold text-gray-900">{record.title}</div>
                <div className="text-xs text-gray-500">{record.message}</div>
            </div>
        ) },
        { key: "user_id", title: "Người nhận", render: (value) => `#${String(value)}` },
        { key: "type", title: "Loại" },
        { key: "is_read", title: "Trạng thái", render: (value) => value ? "Đã đọc" : "Chưa đọc" },
        { key: "reference_id", title: "Tham chiếu", render: (_, record) => record.reference_type ? `${record.reference_type} #${record.reference_id ?? ""}` : "-" },
        { key: "created_at", title: "Thời gian", render: (value) => formatDateTime(value as string) },
        { key: "actions", title: "Thao tác", render: (_, record) => (
            <div className="flex flex-wrap gap-2">
                {!record.is_read && <button type="button" onClick={() => void runAction(() => alertService.markNotificationRead(record.id), "Đã đánh dấu thông báo là đã đọc.")} className="text-xs font-medium text-blue-600 hover:text-blue-900">Đã đọc</button>}
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
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <div className="flex rounded-md border border-gray-200 bg-gray-50 p-1 md:col-span-2">
                            <button type="button" onClick={() => setActiveTab("alerts")} className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold ${activeTab === "alerts" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600"}`}>Cảnh báo</button>
                            <button type="button" onClick={() => setActiveTab("notifications")} className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold ${activeTab === "notifications" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600"}`}>Thông báo</button>
                        </div>
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo tiêu đề..." className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AlertStatus | "")} disabled={activeTab !== "alerts"} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50 disabled:text-gray-400">
                            {statusOptions.map((option) => <option key={option.value || "ALL"} value={option.value}>{option.label}</option>)}
                        </select>
                        <button type="button" onClick={() => void loadData()} disabled={isLoading} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isLoading ? "Đang tải" : "Lọc"}</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => void handleGenerateAlerts()} disabled={isGenerating} className="rounded-md border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 hover:bg-pink-100 disabled:opacity-60">Sinh cảnh báo</button>
                        <button type="button" onClick={() => void handleGenerateNotifications()} disabled={isGenerating} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60">Sinh thông báo</button>
                    </div>
                </div>

                {activeTab === "alerts" ? (
                    <Tablelayout columns={alertColumns} dataSource={alerts} rowKey="id" isLoading={isLoading} />
                ) : (
                    <Tablelayout columns={notificationColumns} dataSource={notifications} rowKey="id" isLoading={isLoading} />
                )}
            </div>
        </DashboardLayout>
    );
}
