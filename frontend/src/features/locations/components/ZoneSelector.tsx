import { useMemo, useState } from "react";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import type { WarehouseZone } from "@/features/locations/services/warehouseService";

interface ZoneSelectorProps {
    warehouses?: WarehouseOption[];
    selectedWarehouseId?: number | null;
    setSelectedWarehouseId?: (id: number) => void;
    selectedZone: string | null;
    setSelectedZone: (zone: string | null) => void;
    onAddZone: (code: string, name?: string, shelfCount?: number, layerCount?: number) => Promise<void>;
    zones?: WarehouseZone[];
}

export default function ZoneSelector({
    warehouses = [],
    selectedWarehouseId,
    setSelectedWarehouseId,
    selectedZone,
    setSelectedZone,
    onAddZone,
    zones = [],
}: ZoneSelectorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newZoneCode, setNewZoneCode] = useState("");
    const [newZoneName, setNewZoneName] = useState("");
    const [shelfCount, setShelfCount] = useState(4);
    const [layerCount, setLayerCount] = useState(4);
    const [isSaving, setIsSaving] = useState(false);

    // Chỉ liệt kê khu có thật trong kho đang chọn. Trước đây khi kho chưa có khu nào,
    // hàm này trả về danh sách ảo A-E khiến người dùng chọn phải khu không tồn tại.
    const zoneOptions = useMemo(() => {
        const codes = new Set(zones.map((zone) => zone.code));
        if (selectedZone) codes.add(selectedZone);
        return Array.from(codes).sort();
    }, [zones, selectedZone]);

    const submitZone = async () => {
        const code = newZoneCode.trim().toUpperCase();
        if (!code || isSaving) return;
        setIsSaving(true);
        try {
            await onAddZone(code, newZoneName.trim() || `Khu vực ${code}`, shelfCount, layerCount);
            setNewZoneCode("");
            setNewZoneName("");
            setShelfCount(4);
            setLayerCount(4);
            setIsAdding(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
                {selectedZone && (
                    <button
                        type="button"
                        onClick={() => setSelectedZone(null)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-pink-600"
                        title="Quay lại bản đồ tổng thể"
                    >
                        Quay lại bản đồ
                    </button>
                )}

                <h1 className="flex items-center gap-1.5 text-lg font-bold uppercase tracking-tight text-gray-900">
                    <span>Sơ đồ cấu trúc kho</span>
                    {selectedZone && <span className="rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-sm font-bold text-pink-600">Khu {selectedZone}</span>}
                </h1>

                {warehouses.length > 0 && (
                    <select
                        value={selectedWarehouseId ?? ""}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val) {
                                setSelectedWarehouseId?.(val);
                                setSelectedZone(null);
                            }
                        }}
                        className="cursor-pointer rounded-lg border border-pink-300 bg-pink-50 px-3 py-1.5 text-sm font-bold text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        title="Chọn kho cần xem sơ đồ"
                    >
                        {warehouses.map((wh) => (
                            <option key={wh.id} value={wh.id}>
                                {wh.name || wh.code} ({wh.code})
                            </option>
                        ))}
                    </select>
                )}

                <select
                    value={selectedZone || "map"}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "map") setSelectedZone(null);
                        else if (val === "add") setIsAdding(true);
                        else setSelectedZone(val);
                    }}
                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                    <option value="map">Bản đồ tổng thể</option>
                    {zoneOptions.map((code) => <option key={code} value={code}>Khu vực {code}</option>)}
                    <option value="add">Thêm khu vực mới</option>
                </select>

                {isAdding && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-pink-100 bg-pink-50 p-2">
                        <input value={newZoneCode} onChange={(e) => setNewZoneCode(e.target.value)} placeholder="Mã khu (VD: F)" className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold" />
                        <input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="Tên khu vực" className="w-40 rounded-md border border-gray-300 px-2 py-1 text-sm" />
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                            <span>Số kệ:</span>
                            <input type="number" min={1} max={20} value={shelfCount} onChange={(e) => setShelfCount(Math.max(1, Number(e.target.value)))} className="w-12 rounded-md border border-gray-300 px-1 py-1 text-center text-sm" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                            <span>Số tầng:</span>
                            <input type="number" min={1} max={20} value={layerCount} onChange={(e) => setLayerCount(Math.max(1, Number(e.target.value)))} className="w-12 rounded-md border border-gray-300 px-1 py-1 text-center text-sm" />
                        </div>
                        <button type="button" onClick={submitZone} disabled={isSaving} className="rounded-md bg-pink-600 px-3 py-1 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60">{isSaving ? "Đang lưu..." : "Lưu khu vực"}</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
                    </div>
                )}
            </div>

            {/* <div className="flex gap-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-green-400 bg-green-100 shadow-sm" /><span>Trống</span></div>
                <div className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-orange-400 bg-orange-100 shadow-sm" /><span>Đang chứa</span></div>
                <div className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded border border-red-400 bg-red-100 shadow-sm" /><span>Đầy</span></div>
            </div> */}
        </div>
    );
}