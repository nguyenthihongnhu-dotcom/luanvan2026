import { formatQuantity } from '@/shared/utils/number';
import { useState } from "react";
// import QRCode from "qrcode";
import type { ViTriKho } from "@/features/locations/hooks/useWarehouse";
import { warehouseService } from "@/features/locations/services/warehouseService";
import type { LocationHistoryItem } from "@/features/locations/services/warehouseService";

interface LocationDetailSidebarProps {
    activeLocation: ViTriKho;
    setActiveLocation: (loc: ViTriKho | null) => void;
    selectedZone: string;
}

function getStatusLabel(status: ViTriKho["TrangThai"]): string {
    if (status === "DangChua") return "Đang chứa";
    if (status === "Day") return "Đã đầy";
    return "Trống";
}

function getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        RECEIPT: "Nhập kho",
        ISSUE: "Xuất kho",
        TRANSFER_IN: "Điều chuyển vào",
        TRANSFER_OUT: "Điều chuyển ra",
        COUNT_ADJUSTMENT_IN: "Điều chỉnh tăng sau kiểm kê",
        COUNT_ADJUSTMENT_OUT: "Điều chỉnh giảm sau kiểm kê",
        MANUAL_ADJUSTMENT_IN: "Điều chỉnh tăng",
        MANUAL_ADJUSTMENT_OUT: "Điều chỉnh giảm",
        RETURN_IN: "Nhập trả",
        RETURN_OUT: "Xuất trả",
        INITIAL_STOCK: "Tồn đầu kỳ",
        REVERSAL: "Đảo phiếu",
    };
    return labels[type] ?? type;
}



function formatDateTime(value: string): string {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function getStoredProductText(location: ViTriKho): string {
    const value = location.SanPhamLuuTru?.trim();
    if (!value) return "";

    const normalizedValue = value.toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
    const shelfCode = location.Ke.toLocaleLowerCase("vi-VN");
    const layerNo = Number(location.Tang);
    const locationNamePatterns = [
        `${shelfCode} t\u1ea7ng ${layerNo}`,
        `${shelfCode} tang ${layerNo}`,
        `t\u1ea7ng ${layerNo}`,
        `tang ${layerNo}`,
    ];

    if (locationNamePatterns.includes(normalizedValue)) return "";
    return value;
}

function parseStoredProducts(value: string): string[] {
    return value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
}

export default function LocationDetailSidebar({
    activeLocation,
    setActiveLocation,
    selectedZone,
}: LocationDetailSidebarProps) {
    const [history, setHistory] = useState<LocationHistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const zoneCode = activeLocation.KhuVuc || selectedZone;
    const locationCode = `${zoneCode}-${activeLocation.Ke}-${activeLocation.Tang}`;
    const storedProductText = getStoredProductText(activeLocation);
    const storedProducts = parseStoredProducts(storedProductText);

    const handleShowHistory = async () => {
        setIsHistoryOpen(true);
        setIsHistoryLoading(true);
        setHistory([]);
        setHistoryError(null);
        try {
            setHistory(await warehouseService.listLocationHistory(activeLocation.MaViTri));
        } catch (error) {
            console.error(error);
            setHistory([]);
            setHistoryError("Không kết nối được backend để tải lịch sử. Kiểm tra server rồi thử lại.");
        } finally {
            setIsHistoryLoading(false);
        }
    };

    /*
    const handlePrintLabel = async () => {
        const qrPayload = JSON.stringify({
            type: "WAREHOUSE_LOCATION",
            id: activeLocation.MaViTri,
            code: locationCode,
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: "M", margin: 1, width: 160 });
        const printWindow = window.open("", "_blank", "width=460,height=560");
        if (!printWindow) {
            window.alert("Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại.");
            return;
        }

        const safeLocationCode = escapeHtml(locationCode);
        const safeStatus = escapeHtml(getStatusLabel(activeLocation.TrangThai));
        const safeProduct = escapeHtml(storedProductText || "Chưa có hàng hóa");

        printWindow.document.write(`
            <!doctype html>
            <html lang="vi">
                <head>
                    <meta charset="utf-8" />
                    <title>Tem vị trí ${safeLocationCode}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; }
                        .label { border: 2px solid #111827; padding: 20px; width: 320px; }
                        .code { font-size: 34px; font-weight: 800; letter-spacing: 1px; }
                        .meta { margin-top: 8px; font-size: 13px; color: #374151; }
                        .qr { margin-top: 18px; width: 160px; height: 160px; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="code">${safeLocationCode}</div>
                        <div class="meta">ID hệ thống: #${activeLocation.MaViTri}</div>
                        <div class="meta">Trạng thái: ${safeStatus}</div>
                        <div class="meta">Hàng hóa: ${safeProduct}</div>
                        <img class="qr" src="${qrDataUrl}" alt="QR ${safeLocationCode}" />
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };
    */

    return (
        <>
            <aside className="flex w-80 animate-in flex-col justify-between border-l border-gray-200 bg-white p-5 shadow-2xl duration-300 slide-in-from-right">
                <div>
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <h3 className="text-lg font-bold text-gray-900">Thông tin vị trí</h3>
                        <button type="button" onClick={() => setActiveLocation(null)} className="text-sm font-bold text-gray-400 hover:text-gray-600">
                            Đóng
                        </button>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400">Mã ID / Tọa độ</label>
                            <p className="text-2xl font-black tracking-wider text-pink-600">{locationCode}</p>
                            <p className="mt-1 text-[10px] text-gray-400">Hệ thống ID: #{activeLocation.MaViTri}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400">Trạng thái</label>
                            <span className={`mt-1 inline-block rounded px-2 py-1 text-xs font-bold uppercase ${activeLocation.TrangThai === "Trong" ? "bg-green-100 text-green-800" : activeLocation.TrangThai === "DangChua" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>
                                {getStatusLabel(activeLocation.TrangThai)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400">Sản phẩm lưu trữ hiện tại</label>
                            {storedProducts.length > 0 ? (
                                <ul className="mt-1 space-y-1 text-sm font-semibold text-gray-700">
                                    {storedProducts.map((product) => (
                                        <li key={product} className="rounded-md bg-gray-50 px-2 py-1 leading-snug">
                                            {product.replace(/(\d+(?:\.\d+)?)(?=\))/g, (match) => formatQuantity(match))}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-0.5 font-semibold text-gray-700">Chưa có hàng hóa</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid gap-2">
                    <button type="button" onClick={() => void handleShowHistory()} disabled={isHistoryLoading} className="w-full rounded-lg bg-pink-600 px-3 py-2 text-center text-sm font-medium leading-5 text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {isHistoryLoading ? "Đang tải lịch sử..." : "Xem lịch sử nhập/xuất"}
                    </button>
                    {/* <button type="button" onClick={() => void handlePrintLabel()} className="w-full rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium leading-5 text-gray-700 transition hover:bg-gray-200">
                        In nhãn Barcode/QR Code
                    </button> */}
                </div>
            </aside>

            {isHistoryOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">Lịch sử vị trí {locationCode}</h2>
                            <button type="button" onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <div className="max-h-[70vh] overflow-auto p-6">
                            {isHistoryLoading ? (
                                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">Đang tải lịch sử...</div>
                            ) : historyError ? (
                                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{historyError}</div>
                            ) : history.length === 0 ? (
                                <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                    <p>Chưa có dữ liệu lịch sử nhập/xuất cho vị trí này.</p>
                                    {storedProducts.length > 0 && (
                                        <div className="space-y-2 text-gray-800">
                                            <p className="font-semibold">Hiện đang chứa:</p>
                                            <ul className="space-y-1">
                                                {storedProducts.map((product) => (
                                                    <li key={product} className="rounded-md bg-white px-3 py-2 font-semibold leading-snug shadow-sm ring-1 ring-gray-100">{product}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="py-2">Thời gian</th>
                                            <th className="py-2">Loại</th>
                                            <th className="py-2">Sản phẩm</th>
                                            <th className="py-2">Số lượng</th>
                                            <th className="py-2">Người thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-2 text-gray-600">{formatDateTime(item.created_at)}</td>
                                                <td className="py-2 font-medium text-gray-900">{getTransactionTypeLabel(item.transaction_type)}</td>
                                                <td className="py-2 text-gray-700">{item.sku} - {item.variant_name || item.product_name}</td>
                                                <td className={item.direction === "IN" ? "py-2 font-semibold text-green-700" : "py-2 font-semibold text-red-700"}>{item.direction === "IN" ? "+" : "-"}{Number(item.quantity).toLocaleString("vi-VN")}</td>
                                                <td className="py-2 text-gray-600">{item.performed_by_name || "Không rõ"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}