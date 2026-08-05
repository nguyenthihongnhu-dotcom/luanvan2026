import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSidebar } from "@/app/providers/useSidebar";
import type { WarehouseZone, ZoneOrientation } from "@/features/locations/services/warehouseService";

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
        layout: {
            gridRow: number | null;
            gridCol: number | null;
            gridSize: number | null;
            gridOrientation?: ZoneOrientation;
        },
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

function cellsOf(zone: WarehouseZone, row: number, col: number, orientation: ZoneOrientation) {
    const span = sizeOf(zone);
    return Array.from({ length: span }, (_, i) => ({
        row: row + (orientation === "VERTICAL" ? i : 0),
        col: col + (orientation === "HORIZONTAL" ? i : 0),
    }));
}

interface DragState {
    zoneId: number;
    orientation: ZoneOrientation;
    x: number;
    y: number;
}

/** Khu hết chỗ trống: mọi vị trí đều đang có hàng hoặc đã đánh dấu FULL. */
function isZoneFull(zone: WarehouseZone) {
    if (zone.locationCount === 0) return false;
    return zone.occupiedCount >= zone.locationCount || zone.fullCount >= zone.locationCount;
}

// Phải di chuyển quá ngưỡng này mới tính là kéo. Nếu bắt kéo ngay từ pointerdown thì
// một cú bấm bình thường cũng bị coi là kéo: vừa ghi lại vị trí cũ, vừa mở trang chi tiết.
const DRAG_THRESHOLD_PX = 5;

export default function WarehouseGridEditor({
    zones,
    warehouseName,
    isSaving = false,
    onSelectZone,
    onCreateZone,
    onSaveZoneLayout,
}: WarehouseGridEditorProps) {
    const { setExtraContent } = useSidebar();
    const [newZoneName, setNewZoneName] = useState("");
    const [newZoneShelves, setNewZoneShelves] = useState(4);
    const [newZoneLayers, setNewZoneLayers] = useState(4);
    const [drag, setDrag] = useState<DragState | null>(null);
    const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);

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

    const draggedZone = drag ? zones.find((zone) => zone.id === drag.zoneId) ?? null : null;

    // Lưới đủ rộng để chứa khu xa nhất, luôn chừa thêm một hàng/cột trống để còn chỗ thả.
    const { rows, cols } = useMemo(() => {
        let maxRow = MIN_ROWS - 1;
        let maxCol = MIN_COLS - 1;
        for (const zone of placedZones) {
            for (const cell of cellsOf(zone, zone.gridRow ?? 0, zone.gridCol ?? 0, zone.gridOrientation)) {
                maxRow = Math.max(maxRow, cell.row);
                maxCol = Math.max(maxCol, cell.col);
            }
        }
        return { rows: maxRow + 2, cols: maxCol + 2 };
    }, [placedZones]);

    const cellOwner = useMemo(() => {
        const map = new Map<string, WarehouseZone>();
        for (const zone of placedZones) {
            if (drag && zone.id === drag.zoneId) continue; // khu đang kéo thì không vẽ ở chỗ cũ
            for (const cell of cellsOf(zone, zone.gridRow ?? 0, zone.gridCol ?? 0, zone.gridOrientation)) {
                map.set(`${cell.row}:${cell.col}`, zone);
            }
        }
        return map;
    }, [placedZones, drag]);

    // Ô sẽ bị chiếm nếu thả ngay bây giờ, dùng để tô vệt xem trước.
    const previewCells = useMemo(() => {
        if (!draggedZone || !hoverCell) return new Set<string>();
        return new Set(
            cellsOf(draggedZone, hoverCell.row, hoverCell.col, drag!.orientation).map((c) => `${c.row}:${c.col}`),
        );
    }, [draggedZone, hoverCell, drag]);

    const previewBlocked = useMemo(() => {
        if (previewCells.size === 0) return false;
        for (const key of previewCells) {
            const [row, col] = key.split(":").map(Number);
            if (row >= rows || col >= cols) return true;
            if (cellOwner.has(key)) return true;
        }
        return false;
    }, [previewCells, cellOwner, rows, cols]);

    const cellFromPoint = useCallback((x: number, y: number) => {
        const el = document.elementFromPoint(x, y);
        const cell = el?.closest<HTMLElement>("[data-grid-cell]");
        if (!cell) return null;
        return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
    }, []);

    // Ghi nhận ý định kéo, chưa kéo thật. Chỉ khi con trỏ đi quá ngưỡng mới chuyển thành kéo.
    const pendingDrag = useRef<{ zone: WarehouseZone; x: number; y: number } | null>(null);
    // Sau một lần kéo thật, phải chặn sự kiện click sinh ra ngay sau pointerup,
    // nếu không thả xong là bị mở luôn trang chi tiết của khu.
    const suppressClick = useRef(false);

    const beginDrag = (zone: WarehouseZone, event: React.PointerEvent) => {
        if (event.button !== 0) return;
        pendingDrag.current = { zone, x: event.clientX, y: event.clientY };
    };

    // Kéo bằng pointer thay vì HTML5 drag-and-drop: trong lúc drag gốc của trình duyệt,
    // sự kiện bàn phím không được gửi tới trang nên không bắt được phím F để xoay hướng.
    // Dùng ref cho trạng thái kéo để listener luôn đọc được giá trị mới nhất mà không
    // phải gắn/gỡ lại theo từng lần di chuột.
    const dragRef = useRef<DragState | null>(null);

    // Cập nhật ref ngay lập tức chứ không đợi effect: nếu người dùng bấm F rồi nhả chuột
    // trong cùng một khung hình, effect chưa kịp chạy và pointerup sẽ đọc phải hướng cũ.
    const applyDrag = useCallback((next: DragState | null | ((prev: DragState | null) => DragState | null)) => {
        setDrag((prev) => {
            const value = typeof next === "function" ? next(prev) : next;
            dragRef.current = value;
            return value;
        });
    }, []);

    useEffect(() => {
        const onMove = (event: PointerEvent) => {
            const pending = pendingDrag.current;
            if (pending && !dragRef.current) {
                const moved = Math.hypot(event.clientX - pending.x, event.clientY - pending.y);
                if (moved < DRAG_THRESHOLD_PX) return;
                applyDrag({
                    zoneId: pending.zone.id,
                    orientation: pending.zone.gridOrientation,
                    x: event.clientX,
                    y: event.clientY,
                });
                setHoverCell(cellFromPoint(event.clientX, event.clientY));
                return;
            }
            if (!dragRef.current) return;
            applyDrag((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : current));
            setHoverCell(cellFromPoint(event.clientX, event.clientY));
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (!dragRef.current) return;
            if (event.key === "f" || event.key === "F") {
                event.preventDefault();
                applyDrag((current) =>
                    current
                        ? { ...current, orientation: current.orientation === "HORIZONTAL" ? "VERTICAL" : "HORIZONTAL" }
                        : current,
                );
            }
            if (event.key === "Escape") {
                pendingDrag.current = null;
                applyDrag(null);
                setHoverCell(null);
            }
        };

        const onUp = (event: PointerEvent) => {
            const current = dragRef.current;
            pendingDrag.current = null;
            applyDrag(null);
            setHoverCell(null);

            // Không vượt ngưỡng nên đây là một cú bấm, để nguyên cho onClick xử lý.
            if (!current) return;

            // Đã kéo thật thì phải chặn click sinh ra ngay sau đó.
            suppressClick.current = true;
            setTimeout(() => {
                suppressClick.current = false;
            }, 0);

            const target = cellFromPoint(event.clientX, event.clientY);
            if (!target || Number.isNaN(target.row) || Number.isNaN(target.col)) return;

            const zone = zones.find((item) => item.id === current.zoneId);
            if (!zone) return;

            // Chặn thả đè lên khu khác, nếu không hai khu sẽ cùng chiếm một ô.
            const wanted = cellsOf(zone, target.row, target.col, current.orientation);
            const clash = wanted.some((cell) => {
                const owner = cellOwner.get(`${cell.row}:${cell.col}`);
                return owner && owner.id !== zone.id;
            });
            if (clash) return;

            const samePlace =
                zone.gridRow === target.row &&
                zone.gridCol === target.col &&
                zone.gridOrientation === current.orientation;
            if (samePlace) return;

            void onSaveZoneLayout(zone.id, {
                gridRow: target.row,
                gridCol: target.col,
                gridSize: sizeOf(zone),
                gridOrientation: current.orientation,
            });
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [zones, cellOwner, cellFromPoint, onSaveZoneLayout, applyDrag]);

    const handleRemoveFromGrid = (zone: WarehouseZone) =>
        onSaveZoneLayout(zone.id, { gridRow: null, gridCol: null, gridSize: sizeOf(zone) });

    const toggleOrientation = (zone: WarehouseZone) =>
        onSaveZoneLayout(zone.id, {
            gridRow: zone.gridRow,
            gridCol: zone.gridCol,
            gridSize: sizeOf(zone),
            gridOrientation: zone.gridOrientation === "HORIZONTAL" ? "VERTICAL" : "HORIZONTAL",
        });

    const submitNewZone = async () => {
        const code = nextZoneCode(zones);
        await onCreateZone(code, newZoneName.trim() || `Khu ${code}`, newZoneShelves, newZoneLayers, {
            gridRow: null,
            gridCol: null,
            openAfterCreate: false,
        });
        setNewZoneName("");
    };

    // Toàn bộ thao tác nằm ở sidebar trái, khu vực chính chỉ còn mặt bằng cho rộng.
    useEffect(() => {
        const zoneChip = (zone: WarehouseZone, placed: boolean) => (
            <div
                key={zone.id}
                onPointerDown={(event) => beginDrag(zone, event)}
                className="flex cursor-grab select-none items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 transition hover:border-pink-300 hover:shadow-md active:cursor-grabbing"
                title="Giữ chuột kéo khu vào ô trên mặt bằng. Đang kéo bấm F để xoay ngang/dọc, Esc để hủy."
            >
                <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: colorByZoneId.get(zone.id) }}
                >
                    {zone.code}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-800">{zone.name}</p>
                    <p className="text-[10px] text-gray-400">
                        {zone.shelfCount} kệ · {zone.gridOrientation === "HORIZONTAL" ? "xếp ngang" : "xếp dọc"}
                        {placed ? ` · ô H${(zone.gridRow ?? 0) + 1}-C${(zone.gridCol ?? 0) + 1}` : ""}
                    </p>
                    <p className={`text-[10px] ${isZoneFull(zone) ? "font-bold text-red-600" : "text-gray-400"}`}>
                        {zone.occupiedCount}/{zone.locationCount} vị trí có hàng{isZoneFull(zone) ? " · ĐẦY" : ""}
                    </p>
                </div>
                <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => void toggleOrientation(zone)}
                    disabled={isSaving}
                    className="shrink-0 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-gray-600 hover:border-pink-200 hover:text-pink-600 disabled:opacity-60"
                    title="Đổi hướng xếp kệ của riêng khu này"
                >
                    {zone.gridOrientation === "HORIZONTAL" ? "↔" : "↕"}
                </button>
                {placed ? (
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => void handleRemoveFromGrid(zone)}
                        disabled={isSaving}
                        className="shrink-0 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-gray-600 hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                        title="Gỡ khu khỏi mặt bằng, không xóa dữ liệu khu"
                    >
                        Gỡ
                    </button>
                ) : (
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => onSelectZone?.(zone.code)}
                        className="shrink-0 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-gray-600 hover:border-pink-200 hover:text-pink-600"
                    >
                        Xem
                    </button>
                )}
            </div>
        );

        setExtraContent(
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Thêm khu mới</h3>
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

                <div className="space-y-2">
                    <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">
                        Khu chưa đặt lên mặt bằng ({unplacedZones.length})
                    </h3>
                    {unplacedZones.length === 0 ? (
                        <p className="py-2 text-center text-xs italic text-gray-400">Mọi khu đã có vị trí</p>
                    ) : (
                        unplacedZones.map((zone) => zoneChip(zone, false))
                    )}
                </div>

                {placedZones.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">
                            Khu đã đặt ({placedZones.length})
                        </h3>
                        {placedZones.map((zone) => zoneChip(zone, true))}
                    </div>
                )}

                <p className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-[11px] leading-relaxed text-gray-500">
                    Giữ chuột kéo khu thả vào ô trên mặt bằng. Đang kéo bấm <b>F</b> để xoay ngang/dọc, <b>Esc</b> để hủy.
                </p>
            </div>,
        );

        return () => setExtraContent(null);
        // Danh sách khu và form phụ thuộc các state dưới đây; cố ý không đưa trạng thái kéo
        // vào deps để mỗi lần di chuột không phải dựng lại toàn bộ nội dung sidebar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setExtraContent, zones, unplacedZones, placedZones, colorByZoneId, newZoneName, newZoneShelves, newZoneLayers, isSaving]);

    return (
        <div className="flex h-[calc(100vh-180px)] flex-1 flex-col overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-6">
            <div className="mb-4">
                <h3 className="text-base font-bold uppercase tracking-wide text-gray-800">
                    Mặt bằng kho {warehouseName ? `- ${warehouseName}` : ""}
                </h3>
                <p className="text-xs text-gray-500">
                    Kéo khu từ sidebar bên trái thả vào ô để đặt lên mặt bằng, vị trí và hướng xếp kệ được lưu xuống cơ sở dữ liệu.
                    Đang kéo bấm <b>F</b> để xoay ngang/dọc, <b>Esc</b> để hủy. Bấm vào khu đã đặt để xem sơ đồ kệ và tầng bên trong.
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
                {zones.length === 0 ? (
                    <div className="flex h-full min-h-56 items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Kho này chưa có khu vực nào</p>
                            <p className="mt-1 text-xs text-gray-500">Dùng ô "Thêm khu mới" ở sidebar bên trái để tạo khu đầu tiên.</p>
                        </div>
                    </div>
                ) : (
                    <div
                        ref={gridRef}
                        className="inline-grid select-none gap-1.5 rounded-3xl border border-gray-200 bg-white p-4 shadow-inner"
                        style={{ gridTemplateColumns: `repeat(${cols}, 68px)` }}
                    >
                        {Array.from({ length: rows * cols }).map((_, index) => {
                            const row = Math.floor(index / cols);
                            const col = index % cols;
                            const key = `${row}:${col}`;
                            const zone = cellOwner.get(key);
                            const color = zone ? colorByZoneId.get(zone.id) : undefined;
                            const isAnchor = zone && zone.gridRow === row && zone.gridCol === col;
                            const isPreview = previewCells.has(key);

                            return (
                                <div
                                    key={key}
                                    data-grid-cell=""
                                    data-row={row}
                                    data-col={col}
                                    onPointerDown={(event) => zone && beginDrag(zone, event)}
                                    onClick={() => {
                                        if (suppressClick.current || !zone) return;
                                        onSelectZone?.(zone.code);
                                    }}
                                    className={`relative flex h-16 items-center justify-center overflow-hidden rounded-2xl border-2 text-sm transition-colors ${
                                        zone ? "cursor-grab border-transparent shadow-sm active:cursor-grabbing" : "border-dashed border-gray-300"
                                    } ${
                                        isPreview
                                            ? previewBlocked
                                                ? "border-red-400 bg-red-100"
                                                : "border-pink-500 bg-pink-100"
                                            : ""
                                    } ${zone && isZoneFull(zone) && !isPreview ? "border-solid border-red-400" : ""}`}
                                    style={zone && color && !isPreview ? { backgroundColor: `${color}25` } : undefined}
                                    title={
                                        zone
                                            ? `${zone.name} - ${zone.shelfCount} kệ, ${zone.occupiedCount}/${zone.locationCount} vị trí đang có hàng${isZoneFull(zone) ? " (ĐẦY, không còn ô trống)" : ""}`
                                            : `Ô trống H${row + 1}-C${col + 1}`
                                    }
                                >
                                    {/* Khu hết chỗ: phủ vệt gạch chéo đỏ để nhìn phát là biết */}
                                    {zone && isZoneFull(zone) && !isPreview && (
                                        <span
                                            aria-hidden
                                            className="pointer-events-none absolute inset-0"
                                            style={{
                                                backgroundImage:
                                                    "repeating-linear-gradient(45deg, rgba(220,38,38,0.45) 0, rgba(220,38,38,0.45) 3px, transparent 3px, transparent 9px)",
                                            }}
                                        />
                                    )}
                                    {zone ? (
                                        <div className="pointer-events-none relative text-center">
                                            <div className="font-bold" style={{ color }}>{zone.code}</div>
                                            {isAnchor && (
                                                <div className="mt-0.5 text-[10px] font-semibold text-gray-600">
                                                    {isZoneFull(zone) ? "ĐẦY" : `${zone.shelfCount} kệ`}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="pointer-events-none text-[10px] text-gray-300">H{row + 1}-C{col + 1}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {drag && draggedZone && (
                <div
                    className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-xl border-2 border-pink-500 bg-white/95 px-3 py-2 shadow-lg"
                    style={{ left: drag.x + 14, top: drag.y + 14 }}
                >
                    <span
                        className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: colorByZoneId.get(draggedZone.id) }}
                    >
                        {draggedZone.code}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                        {sizeOf(draggedZone)} ô · {drag.orientation === "HORIZONTAL" ? "ngang ↔" : "dọc ↕"}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">F: xoay</span>
                </div>
            )}
        </div>
    );
}
