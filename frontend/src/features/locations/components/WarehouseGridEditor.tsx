import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ViTriKho } from "@/features/locations/hooks/useWarehouse";

interface CellPosition {
    row: number;
    col: number;
}

interface Zone {
    id: string;
    code: string;
    name: string;
    color: string;
    size: number;
    row: number;
    col: number;
    occupiedCells: CellPosition[];
}

interface WarehouseGridEditorProps {
    onSelectZone?: (zoneCode: string) => void;
    locations?: ViTriKho[];
}

const DEFAULT_ZONES: Zone[] = [
    {
        id: "zone-a",
        code: "A",
        name: "Zone A - Sữa và tã",
        color: "#3b82f6",
        size: 4,
        row: 1,
        col: 1,
        occupiedCells: [
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 1, col: 3 },
            { row: 1, col: 4 },
        ],
    },
    {
        id: "zone-b",
        code: "B",
        name: "Zone B - Đồ chơi và xe đẩy",
        color: "#a855f7",
        size: 4,
        row: 3,
        col: 1,
        occupiedCells: [
            { row: 3, col: 1 },
            { row: 3, col: 2 },
            { row: 3, col: 3 },
            { row: 3, col: 4 },
        ],
    },
    {
        id: "zone-c",
        code: "C",
        name: "Zone C - Thời trang trẻ em",
        color: "#10b981",
        size: 3,
        row: 5,
        col: 1,
        occupiedCells: [
            { row: 5, col: 1 },
            { row: 5, col: 2 },
            { row: 5, col: 3 },
        ],
    },
    {
        id: "zone-d",
        code: "D",
        name: "Zone D - Thực phẩm ăn dặm",
        color: "#f59e0b",
        size: 3,
        row: 1,
        col: 7,
        occupiedCells: [
            { row: 1, col: 7 },
            { row: 2, col: 7 },
            { row: 3, col: 7 },
        ],
    },
    {
        id: "zone-e",
        code: "E",
        name: "Zone E - Chăm sóc sức khỏe",
        color: "#ef4444",
        size: 2,
        row: 5,
        col: 8,
        occupiedCells: [
            { row: 5, col: 8 },
            { row: 5, col: 9 },
        ],
    },
];

function getNextZoneCode(zones: Zone[]) {
    const usedCodes = new Set(zones.map((zone) => zone.code));
    for (let charCode = 65; charCode <= 90; charCode += 1) {
        const code = String.fromCharCode(charCode);
        if (!usedCodes.has(code)) return code;
    }
    return `${zones.length + 1}`;
}

function getColor(index: number) {
    const colors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#64748b"];
    return colors[index % colors.length];
}

export default function WarehouseGridEditor({ onSelectZone, locations = [] }: WarehouseGridEditorProps) {
    const { setExtraContent } = useSidebar();
    const [rows, setRows] = useState(8);
    const [cols, setCols] = useState(12);
    const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
    const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
    const [newZoneName, setNewZoneName] = useState("");
    const [newZoneSize, setNewZoneSize] = useState(4);

    const backendZoneCodes = useMemo(() => {
        return Array.from(new Set(locations.map((location) => location.KhuVuc).filter(Boolean))).sort();
    }, [locations]);

    const createNewZone = useCallback(() => {
        const code = getNextZoneCode(zones);
        const zone: Zone = {
            id: `zone-${code.toLowerCase()}`,
            code,
            name: newZoneName.trim() || `Zone ${code}`,
            color: getColor(zones.length),
            size: newZoneSize,
            row: -1,
            col: -1,
            occupiedCells: [],
        };

        setZones((currentZones) => [...currentZones, zone]);
        setNewZoneName("");
    }, [newZoneName, newZoneSize, zones]);

    const handleDragStart = (event: React.DragEvent, zoneId: string) => {
        event.dataTransfer.setData("zoneId", zoneId);
        event.dataTransfer.effectAllowed = "move";
    };

    const handleDrop = (event: React.DragEvent, targetRow: number, targetCol: number) => {
        event.preventDefault();
        const zoneId = event.dataTransfer.getData("zoneId");
        if (!zoneId) return;

        setZones((currentZones) => {
            const zoneIndex = currentZones.findIndex((zone) => zone.id === zoneId);
            if (zoneIndex < 0) return currentZones;

            const zone = currentZones[zoneIndex];
            const occupiedCells: CellPosition[] = [];
            for (let index = 0; index < zone.size; index += 1) {
                const nextCell = orientation === "horizontal"
                    ? { row: targetRow, col: targetCol + index }
                    : { row: targetRow + index, col: targetCol };

                if (nextCell.row >= rows || nextCell.col >= cols) break;
                occupiedCells.push(nextCell);
            }

            const nextZones = [...currentZones];
            nextZones[zoneIndex] = {
                ...zone,
                row: targetRow,
                col: targetCol,
                occupiedCells,
            };
            return nextZones;
        });
    };

    const getZoneAt = (row: number, col: number) => {
        return zones.find((zone) => zone.occupiedCells.some((cell) => cell.row === row && cell.col === col));
    };

    const removeZone = useCallback((id: string) => {
        setZones((currentZones) => currentZones.filter((zone) => zone.id !== id));
    }, []);

    useEffect(() => {
        setExtraContent(
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Cấu hình lưới kho</h3>
                    <div className="flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50 p-2">
                        <span className="text-xs font-semibold text-gray-600">Số hàng:</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setRows(Math.max(6, rows - 1))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">-</button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{rows}</span>
                            <button type="button" onClick={() => setRows(rows + 1)} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">+</button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50 p-2">
                        <span className="text-xs font-semibold text-gray-600">Số cột:</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setCols(Math.max(8, cols - 1))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">-</button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{cols}</span>
                            <button type="button" onClick={() => setCols(cols + 1)} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">+</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Hướng bố trí khi thả</h3>
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <button type="button" onClick={() => setOrientation("horizontal")} className={`flex-1 cursor-pointer border-0 py-1.5 text-xs font-bold transition-colors ${orientation === "horizontal" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Ngang</button>
                        <button type="button" onClick={() => setOrientation("vertical")} className={`flex-1 cursor-pointer border-0 py-1.5 text-xs font-bold transition-colors ${orientation === "vertical" ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Dọc</button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Thêm zone mới</h3>
                    <div className="mb-2 space-y-1">
                        <label htmlFor="zone-name-input" className="block text-[11px] font-semibold text-gray-600">Tên phân khu tùy chọn:</label>
                        <input
                            id="zone-name-input"
                            type="text"
                            value={newZoneName}
                            onChange={(event) => setNewZoneName(event.target.value)}
                            placeholder="VD: Sữa và tã, đồ chơi..."
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                        />
                    </div>
                    <div className="mb-2 flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50 p-2">
                        <span className="text-xs font-semibold text-gray-600">Số kệ:</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setNewZoneSize(Math.max(1, newZoneSize - 1))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">-</button>
                            <span className="w-8 text-center text-xs font-bold text-gray-800">{newZoneSize}</span>
                            <button type="button" onClick={() => setNewZoneSize(newZoneSize + 1)} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50">+</button>
                        </div>
                    </div>
                    <button type="button" onClick={createNewZone} className="w-full cursor-pointer rounded-lg border-0 bg-pink-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-pink-700">
                        + Thêm phân khu mới
                    </button>
                </div>

                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Kéo thả phân khu</h3>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {zones.length === 0 && <p className="py-4 text-center text-xs italic text-gray-400">Chưa có phân khu nào</p>}
                        {zones.map((zone) => (
                            <div key={zone.id} draggable onDragStart={(event) => handleDragStart(event, zone.id)} className="flex cursor-grab select-none items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 transition hover:border-pink-300 hover:shadow-md active:cursor-grabbing">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm" style={{ backgroundColor: zone.color }}>{zone.code}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-gray-800">{zone.name}</p>
                                    <p className="text-[9px] text-gray-400">{zone.size} kệ - {zone.occupiedCells.length > 0 ? "Đã đặt" : "Chưa đặt"}</p>
                                </div>
                                <button type="button" onClick={(event) => { event.stopPropagation(); removeZone(zone.id); }} className="ml-1 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 text-xs font-bold text-red-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Xóa phân khu">x</button>
                            </div>
                        ))}
                    </div>
                </div>

                {backendZoneCodes.length > 0 && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs text-gray-500">
                        Zone từ backend: {backendZoneCodes.join(", ")}
                    </div>
                )}
            </div>
        );

        return () => setExtraContent(null);
    }, [backendZoneCodes, cols, createNewZone, newZoneName, newZoneSize, orientation, removeZone, rows, setExtraContent, zones]);

    return (
        <div className="flex h-[calc(100vh-180px)] flex-1 flex-col overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-6">
            <div className="mb-4">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-800">Mặt bằng bố trí kho</h3>
                <p className="text-xs text-gray-500">
                    Kéo các phân khu từ thanh menu bên trái, thả vào ô bất kỳ trên lưới để xác định vị trí. Hướng bố trí ngang/dọc sẽ áp dụng khi thả.
                </p>
            </div>

            <div className="flex flex-1 items-start justify-start overflow-auto">
                <div className="inline-grid gap-1.5 rounded-3xl border border-gray-200 bg-white p-4 shadow-inner" style={{ gridTemplateColumns: `repeat(${cols}, 68px)` }}>
                    {Array.from({ length: rows * cols }).map((_, index) => {
                        const row = Math.floor(index / cols);
                        const col = index % cols;
                        const zone = getZoneAt(row, col);

                        return (
                            <div
                                key={index}
                                onDrop={(event) => handleDrop(event, row, col)}
                                onDragOver={(event) => event.preventDefault()}
                                onClick={() => zone && onSelectZone?.(zone.code)}
                                className={`flex h-16 cursor-pointer items-center justify-center rounded-2xl border-2 text-sm font-medium transition-all hover:scale-105 ${zone ? "border-transparent shadow-sm" : "border-dashed border-gray-300 hover:border-pink-300 hover:bg-pink-50/20"}`}
                                style={zone ? { backgroundColor: `${zone.color}25` } : undefined}
                            >
                                {zone ? (
                                    <div className="text-center">
                                        <div className="font-bold" style={{ color: zone.color }}>{zone.code}</div>
                                        <div className="mt-0.5 text-[10px] text-gray-500">{zone.size} kệ</div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-gray-300">({row + 1}, {col + 1})</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
