import React, { useEffect, useMemo, useState } from "react";
import { useSidebar } from "@/app/providers/useSidebar";
import type { WarehouseZone } from "@/features/locations/services/warehouseService";

interface WarehouseGridEditorProps {
    /** Khu đọc từ bảng warehouse_zones của kho đang chọn. Mỗi kho một mặt bằng riêng. */
    zones: WarehouseZone[];
    warehouseName?: string;
    isSaving?: boolean;
    onSelectZone?: (zoneCode: string) => void;
    onCreateZone: (
        code: string,
        name?: string,
        shelfCount?: number,
        layerCount?: number,
        options?: { gridRow?: number | null; gridCol?: number | null; openAfterCreate?: boolean },
    ) => Promise<void>;
    onSaveZoneLayout: (
        zoneId: number,
        layout: { gridRow: number | null; gridCol: number | null; gridSize: number | null },
    ) => Promise<void>;
}

const MIN_ROWS = 6;
const MIN_COLS = 8;
const PALETTE = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#64748b", "#db2777"];

/** Màu gán theo thứ tự khu nên mở lại vẫn giữ nguyên màu. */
function colorOf(index: number) {
    return PALETTE[index % PALETTE.length];
}

function nextZoneCode(zones: WarehouseZone[]) {
    const used = new Set(zones.map((zone) => zone.code.toUpperCase()));
    for (let charCode = 65; charCode <= 90; charCode += 1) {
        const code = String.fromCharCode(charCode);
        if (!used.has(code)) return code;
    }
    return `K${zones.length + 1}`;
}

/** Số ô khu chiếm trên mặt bằng: ưu tiên grid_size đã lưu, không có thì lấy theo số kệ. */
function sizeOf(zone: WarehouseZone) {
    return Math.max(1, zone.gridSize ?? zone.shelfCount ?? 1);
}

export default function WarehouseGridEditor({
    zones,
    warehouseName,
    isSaving = false,
    onSelectZone,
    onCreateZone,
    onSaveZoneLayout,
}: WarehouseGridEditorProps) {
    const { setExtraContent } = useSidebar();
    const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
    const [newZoneName, setNewZoneName] = useState("");
    const [newZoneShelves, setNewZoneShelves] = useState(4);
    const [newZoneLayers, setNewZoneLayers] = useState(4);
    const [draggingZoneId, setDraggingZoneId] = useState<number | null>(null);

    const placedZones = useMemo(
        () => zones.filter((zone) => zone.gridRow !== null && zone.gridCol !== null),
        [zones],
    );
    const unplacedZones = useMemo(
        () => zones.filter((zone) => zone.gridRow === null || zone.gridCol === null),
        [zones],
    );

    const colorByZoneId = useMemo(() => {
        const map = new Map<number, string>();
        zones.forEach((zone, index) => map.set(zone.id, colorOf(index)));
        return map;
    }, [zones]);

    // Lưới đủ rộng để chứa khu xa nhất, luôn chừa thêm một hàng/cột trống để còn chỗ thả.
    const { rows, cols } = useMemo(() => {
        let maxRow = MIN_ROWS - 1;
        let maxCol = MIN_COLS - 1;
        for (const zone of placedZones) {
            const span = sizeOf(zone);
            maxRow = Math.max(maxRow, (zone.gridRow ?? 0) + (orientation === "vertical" ? span - 1 : 0));
            maxCol = Math.max(maxCol, (zone.gridCol ?? 0) + (orientation === "horizontal" ? span - 1 : 0));
        }
        return { rows: maxRow + 2, cols: maxCol + 2 };
    }, [placedZones, orientation]);

    const cellOwner = useMemo(() => {
        const map = new Map<string, WarehouseZone>();
        for (const zone of placedZones) {
            const span = sizeOf(zone);
            for (let i = 0; i < span; i += 1) {
                const row = (zone.gridRow ?? 0) + (orientation === "vertical" ? i : 0);
                const col = (zone.gridCol ?? 0) + (orientation === "horizontal" ? i : 0);
                map.set(`${row}:${col}`, zone);
            }
        }
        return map;
    }, [placedZones, orientation]);

    const handleDrop = async (event: React.DragEvent, row: number, col: number) => {
        event.preventDefault();
        const rawId = event.dataTransfer.getData("zoneId");
        setDraggingZoneId(null);
        const zoneId = Number(rawId);
        if (!Number.isFinite(zoneId) || zoneId <= 0) return;
        const zone = zones.find((item) => item.id === zoneId);
        if (!zone) return;

        await onSaveZoneLayout(zoneId, { gridRow: row, gridCol: col, gridSize: sizeOf(zone) });
    };

    const handleRemoveFromGrid = async (zone: WarehouseZone) => {
        await onSaveZoneLayout(zone.id, { gridRow: null, gridCol: null, gridSize: sizeOf(zone) });
    };

    const submitNewZone = async () => {
        const code = nextZoneCode(zones);
        await onCreateZone(code, newZoneName.trim() || `Khu ${code}`, newZoneShelves, newZoneLayers, {
            // Tạo xong khu nằm ở danh sách chưa đặt, người dùng kéo lên mặt bằng sau.
            gridRow: null,
            gridCol: null,
            openAfterCreate: false,
        });
        setNewZoneName("");
    };

    const zoneForm = (
        <div className="space-y-2">
            <div className="space-y-1">
                <label htmlFor="zone-name-input" className="block text-[11px] font-semibold text-gray-600">Tên khu</label>
                <input
                    id="zone-name-input"
                    type="text"
                    value={newZoneName}
                    onChange={(event) => setNewZoneName(event.target.value)}
                    placeholder="VD: Sữa và tã"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50 p-2">
                <span className="text-xs font-semibold text-gray-600">Số kệ</span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setNewZoneShelves(Math.max(1, newZoneShelves - 1))} className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">-</button>
                    <span className="w-8 text-center text-xs font-bold text-gray-800">{newZoneShelves}</span>
                    <button type="button" onClick={() => setNewZoneShelves(Math.min(20, newZoneShelves + 1))} className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">+</button>
                </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50 p-2">
                <span className="text-xs font-semibold text-gray-600">Số tầng mỗi kệ</span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setNewZoneLayers(Math.max(1, newZoneLayers - 1))} className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">-</button>
                    <span className="w-8 text-center text-xs font-bold text-gray-800">{newZoneLayers}</span>
                    <button type="button" onClick={() => setNewZoneLayers(Math.min(20, newZoneLayers + 1))} className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">+</button>
                </div>
            </div>
            <button
                type="button"
                onClick={() => void submitNewZone()}
                disabled={isSaving}
                className="w-full rounded-lg bg-pink-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-pink-700 disabled:opacity-60"
            >
                {isSaving ? "Đang lưu..." : "+ Thêm khu mới"}
            </button>
        </div>
    );

    // Sidebar phụ mặc định thu gọn nên mọi thao tác quan trọng đều có sẵn ngay trên
    // khu vực chính; bản trong sidebar chỉ là tiện tay khi người dùng mở sidebar ra.
    useEffect(() => {
        setExtraContent(
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Thêm khu mới</h3>
                    {zoneForm}
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs text-gray-500">
                    Khu trong kho: {zones.length === 0 ? "chưa có khu nào" : zones.map((zone) => zone.code).join(", ")}
                </div>
            </div>,
        );

        return () => setExtraContent(null);
        // zoneForm được dựng lại theo các state bên dưới nên không cần liệt kê riêng
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setExtraContent, zones, newZoneName, newZoneShelves, newZoneLayers, isSaving]);

    return (
        <div className="flex h-[calc(100vh-180px)] flex-1 flex-col overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold uppercase tracking-wide text-gray-800">
                        Mặt bằng kho {warehouseName ? `- ${warehouseName}` : ""}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Kéo khu từ danh sách bên phải thả vào ô để đặt lên mặt bằng, vị trí được lưu xuống cơ sở dữ liệu.
                        Bấm vào khu đã đặt để xem sơ đồ kệ và tầng bên trong.
                    </p>
                </div>
                <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <button type="button" onClick={() => setOrientation("horizontal")} className={`px-3 py-1.5 text-xs font-bold transition-colors ${orientation === "horizontal" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Kệ xếp ngang</button>
                    <button type="button" onClick={() => setOrientation("vertical")} className={`px-3 py-1.5 text-xs font-bold transition-colors ${orientation === "vertical" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Kệ xếp dọc</button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 gap-4">
                <div className="min-w-0 flex-1 overflow-auto">
                    {zones.length === 0 ? (
                        <div className="flex h-full min-h-56 items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Kho này chưa có khu vực nào</p>
                                <p className="mt-1 text-xs text-gray-500">Dùng ô "Thêm khu mới" bên phải để tạo khu đầu tiên.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="inline-grid gap-1.5 rounded-3xl border border-gray-200 bg-white p-4 shadow-inner" style={{ gridTemplateColumns: `repeat(${cols}, 68px)` }}>
                            {Array.from({ length: rows * cols }).map((_, index) => {
                                const row = Math.floor(index / cols);
                                const col = index % cols;
                                const zone = cellOwner.get(`${row}:${col}`);
                                const color = zone ? colorByZoneId.get(zone.id) : undefined;
                                const isAnchor = zone && zone.gridRow === row && zone.gridCol === col;

                                return (
                                    <div
                                        key={`${row}-${col}`}
                                        onDrop={(event) => void handleDrop(event, row, col)}
                                        onDragOver={(event) => event.preventDefault()}
                                        onClick={() => zone && onSelectZone?.(zone.code)}
                                        draggable={Boolean(zone)}
                                        onDragStart={(event) => {
                                            if (!zone) return;
                                            event.dataTransfer.setData("zoneId", String(zone.id));
                                            setDraggingZoneId(zone.id);
                                        }}
                                        onDragEnd={() => setDraggingZoneId(null)}
                                        className={`flex h-16 items-center justify-center rounded-2xl border-2 text-sm transition-all ${zone ? "cursor-pointer border-transparent shadow-sm hover:scale-105" : "border-dashed border-gray-300 hover:border-pink-300 hover:bg-pink-50/20"} ${draggingZoneId === zone?.id ? "opacity-40" : ""}`}
                                        style={zone && color ? { backgroundColor: `${color}25` } : undefined}
                                        title={zone ? `${zone.name} - ${zone.shelfCount} kệ, ${zone.locationCount} vị trí` : `Ô trống H${row + 1}-C${col + 1}`}
                                    >
                                        {zone ? (
                                            <div className="text-center">
                                                <div className="font-bold" style={{ color }}>{zone.code}</div>
                                                {isAnchor && <div className="mt-0.5 text-[10px] text-gray-500">{zone.shelfCount} kệ</div>}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300">H{row + 1}-C{col + 1}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <aside className="w-72 shrink-0 space-y-4 overflow-auto rounded-2xl border border-gray-200 bg-white p-4">
                    <div>
                        <h4 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Thêm khu mới</h4>
                        {zoneForm}
                    </div>

                    <div>
                        <h4 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">
                            Khu chưa đặt lên mặt bằng ({unplacedZones.length})
                        </h4>
                        <div className="space-y-2">
                            {unplacedZones.length === 0 && (
                                <p className="py-3 text-center text-xs italic text-gray-400">Mọi khu đã có vị trí</p>
                            )}
                            {unplacedZones.map((zone) => (
                                <div
                                    key={zone.id}
                                    draggable
                                    onDragStart={(event) => {
                                        event.dataTransfer.setData("zoneId", String(zone.id));
                                        setDraggingZoneId(zone.id);
                                    }}
                                    onDragEnd={() => setDraggingZoneId(null)}
                                    className="flex cursor-grab select-none items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 transition hover:border-pink-300 hover:shadow-md active:cursor-grabbing"
                                >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colorByZoneId.get(zone.id) }}>{zone.code}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-bold text-gray-800">{zone.name}</p>
                                        <p className="text-[10px] text-gray-400">{zone.shelfCount} kệ - {zone.locationCount} vị trí</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onSelectZone?.(zone.code)}
                                        className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:border-pink-200 hover:text-pink-600"
                                    >
                                        Xem
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {placedZones.length > 0 && (
                        <div>
                            <h4 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">
                                Khu đã đặt ({placedZones.length})
                            </h4>
                            <div className="space-y-2">
                                {placedZones.map((zone) => (
                                    <div key={zone.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colorByZoneId.get(zone.id) }}>{zone.code}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-gray-800">{zone.name}</p>
                                            <p className="text-[10px] text-gray-400">Ô H{(zone.gridRow ?? 0) + 1}-C{(zone.gridCol ?? 0) + 1}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => void handleRemoveFromGrid(zone)}
                                            disabled={isSaving}
                                            className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                                            title="Gỡ khu khỏi mặt bằng, không xóa dữ liệu khu"
                                        >
                                            Gỡ
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
