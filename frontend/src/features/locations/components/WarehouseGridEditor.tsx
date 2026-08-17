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
    onDeleteZone?: (zone: WarehouseZone) => Promise<void>;
    onRenameZone?: (zone: WarehouseZone) => Promise<void>;
}

const MIN_ROWS = 6;
const MIN_COLS = 8;
const PALETTE = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#64748b", "#db2777"];

/** Màu gán theo thứ tự khu nên mở lại vẫn giữ nguyên màu. */
function colorOf(index: number) {
    return PALETTE[index % PALETTE.length];
}

/**
 * Biệt danh của khu, rỗng nếu khu chưa được đặt tên riêng.
 *
 * Cột `name` mặc định được sinh theo mã (`Khu A`, `Khu vực D`) nên những giá trị
 * đó không phải biệt danh thật — coi như chưa đặt để mặt bằng chỉ hiện mã.
 */
function nicknameOf(zone: WarehouseZone): string {
    const name = (zone.name ?? "").trim();
    if (!name) return "";

    const code = zone.code.trim().toUpperCase();
    const generated = [code, `KHU ${code}`, `KHU VỰC ${code}`, `ZONE ${code}`];
    return generated.includes(name.toUpperCase()) ? "" : name;
}

/**
 * Nhãn hiển thị của khu: ưu tiên tên thủ kho tự đặt, chưa đặt thì mới rơi về `Khu A`.
 *
 * Người dùng nhớ khu theo tên hàng ("Sữa và tã") chứ không theo chữ cái, nên mặt bằng
 * và sidebar đều lấy tên làm nhãn chính; mã khu chỉ còn dùng trong mã ô lưu trữ.
 */
function labelOf(zone: WarehouseZone): string {
    return nicknameOf(zone) || `Khu ${zone.code}`;
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

/**
 * Khu không còn ô trống để xếp hàng mới vào: mọi ô đều đang có hàng hoặc đã đánh
 * dấu FULL. Đây là "hết ô trống" chứ không phải "hết sức chứa" — một khu chỉ có
 * một ô mà ô đó mới dùng 620/800 vẫn rơi vào trường hợp này, nên nhãn phải nói
 * đúng như vậy thay vì gắn chữ ĐẦY.
 */
function isZoneFull(zone: WarehouseZone) {
    if (zone.locationCount === 0) return false;
    return zone.occupiedCount >= zone.locationCount || zone.fullCount >= zone.locationCount;
}

// Phải di chuyển quá ngưỡng này mới tính là kéo. Nếu bắt kéo ngay từ pointerdown thì
// một cú bấm bình thường cũng bị coi là kéo: vừa ghi lại vị trí cũ, vừa mở trang chi tiết.
const DRAG_THRESHOLD_PX = 5;

interface ZoneCreateFormProps {
    zones: WarehouseZone[];
    isSaving: boolean;
    onCreateZone: WarehouseGridEditorProps["onCreateZone"];
}

/**
 * Form thêm khu, tự giữ lấy state của mình.
 *
 * Trước đây ô tên dùng state của WarehouseGridEditor, mà nội dung sidebar lại nằm trong
 * state của SidebarProvider: mỗi phím gõ phải đi vòng qua hai component rồi mới quay lại
 * ô nhập. Vòng lặp đó cắt ngang bộ gõ tiếng Việt (Unikey/Telex gửi backspace rồi ký tự
 * mới), nên gõ "sữa" chỉ ra "sua". Để state ngay tại form và ô tên không bị React ghi đè
 * giá trị trong lúc gõ thì dấu mới bám được vào chữ.
 */
function ZoneCreateForm({ zones, isSaving, onCreateZone }: ZoneCreateFormProps) {
    const nameRef = useRef<HTMLInputElement | null>(null);
    const [shelves, setShelves] = useState(4);
    const [layers, setLayers] = useState(4);

    const submit = async () => {
        const code = nextZoneCode(zones);
        const name = nameRef.current?.value.trim() ?? "";
        await onCreateZone(code, name || `Khu ${code}`, shelves, layers, {
            gridRow: null,
            gridCol: null,
            openAfterCreate: false,
        });
        if (nameRef.current) nameRef.current.value = "";
    };

    const stepper = (label: string, value: number, setValue: (next: number) => void) => (
        <div className="flex items-center justify-between rounded-xl border border-gray-200/50 bg-gray-50 p-2">
            <span className="text-xs font-semibold text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setValue(Math.max(1, value - 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50"
                    aria-label={`Giảm ${label.toLowerCase()}`}
                >
                    -
                </button>
                <span className="w-8 text-center text-xs font-bold text-gray-800">{value}</span>
                <button
                    type="button"
                    onClick={() => setValue(Math.min(20, value + 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-bold shadow-sm hover:bg-gray-50"
                    aria-label={`Tăng ${label.toLowerCase()}`}
                >
                    +
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-2">
            <h3 className="mb-2 border-b border-gray-100 pb-2 text-xs font-bold uppercase text-gray-500">Thêm khu mới</h3>
            <div className="space-y-1">
                <label htmlFor="zone-name-input" className="block text-[11px] font-semibold text-gray-600">Tên khu</label>
                <input
                    id="zone-name-input"
                    ref={nameRef}
                    type="text"
                    lang="vi"
                    defaultValue=""
                    onKeyDown={(event) => {
                        // Bộ gõ tiếng Việt đang ghép dấu cũng bắn Enter, gửi form lúc đó là mất chữ.
                        if (event.key === "Enter" && !event.nativeEvent.isComposing) void submit();
                    }}
                    placeholder="VD: Sữa và tã"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-pink-500 focus:outline-none"
                />
            </div>
            {stepper("Số kệ", shelves, setShelves)}
            {stepper("Số tầng mỗi kệ", layers, setLayers)}
            <button
                type="button"
                onClick={() => void submit()}
                disabled={isSaving}
                className="w-full rounded-lg bg-pink-600 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-pink-700 disabled:opacity-60"
            >
                {isSaving ? "Đang lưu..." : "+ Thêm khu mới"}
            </button>
        </div>
    );
}

export default function WarehouseGridEditor({
    zones,
    warehouseName,
    isSaving = false,
    onSelectZone,
    onCreateZone,
    onSaveZoneLayout,
    onDeleteZone,
    onRenameZone,
}: WarehouseGridEditorProps) {
    const { setExtraContent } = useSidebar();
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

    // Toàn bộ thao tác nằm ở sidebar trái, khu vực chính chỉ còn mặt bằng cho rộng.
    useEffect(() => {
        // Nút phụ dùng chung một cỡ chữ và một khoảng đệm để hàng nút dưới thẻ khu đều nhau.
        const chipButton =
            "rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40";

        // Thẻ khu xếp làm hai tầng: tầng trên là thông tin, tầng dưới là hàng nút.
        // Nhồi cả bốn nút vào cùng một hàng với phần chữ thì sidebar 256px không đủ chỗ,
        // phần chữ bị bóp còn một ký tự mỗi dòng và trông như nút đè lên tên khu.
        const zoneChip = (zone: WarehouseZone, placed: boolean) => (
            <div
                key={zone.id}
                onPointerDown={(event) => beginDrag(zone, event)}
                className="cursor-grab select-none space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 transition hover:border-pink-300 hover:shadow-md active:cursor-grabbing"
                title="Giữ chuột kéo khu vào ô trên mặt bằng. Đang kéo bấm F để xoay ngang/dọc, Esc để hủy."
            >
                <div className="flex items-start gap-2">
                    <span
                        aria-hidden
                        className="mt-1 h-3 w-3 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: colorByZoneId.get(zone.id) }}
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-gray-800" title={labelOf(zone)}>
                            {labelOf(zone)}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-tight text-gray-400">
                            {zone.shelfCount} kệ · {zone.gridOrientation === "HORIZONTAL" ? "xếp ngang" : "xếp dọc"}
                            {placed ? ` · ô H${(zone.gridRow ?? 0) + 1}-C${(zone.gridCol ?? 0) + 1}` : ""}
                        </p>
                        <p className={`text-[10px] leading-tight ${isZoneFull(zone) ? "font-bold text-red-600" : "text-gray-400"}`}>
                            {zone.occupiedCount}/{zone.locationCount} ô đã có hàng{isZoneFull(zone) ? " · hết ô trống" : ""}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => void toggleOrientation(zone)}
                        disabled={isSaving}
                        className={`${chipButton} hover:border-pink-200 hover:text-pink-600`}
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
                            className={`${chipButton} hover:border-red-200 hover:text-red-600`}
                            title="Gỡ khu khỏi mặt bằng, không xóa dữ liệu khu"
                        >
                            Gỡ
                        </button>
                    ) : (
                        <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => onSelectZone?.(zone.code)}
                            className={`${chipButton} hover:border-pink-200 hover:text-pink-600`}
                        >
                            Xem
                        </button>
                    )}
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => void onRenameZone?.(zone)}
                        disabled={isSaving}
                        className={`${chipButton} hover:border-pink-200 hover:text-pink-600`}
                        title={nicknameOf(zone) ? "Đổi tên khu" : "Đặt tên cho khu, ví dụ Sữa và tã"}
                    >
                        {nicknameOf(zone) ? "Đổi tên" : "Đặt tên"}
                    </button>
                    {/* Khu còn hàng thì không cho xóa; nút mờ đi và nói rõ lý do
                        thay vì để người dùng bấm rồi nhận lỗi từ server. */}
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => void onDeleteZone?.(zone)}
                        disabled={isSaving || zone.occupiedCount > 0}
                        className={`${chipButton} hover:border-red-300 hover:text-red-600`}
                        title={
                            zone.occupiedCount > 0
                                ? `Không xóa được: khu còn ${zone.occupiedCount} vị trí đang có hàng`
                                : `Xóa ${labelOf(zone)} cùng toàn bộ kệ và ô lưu trữ bên trong`
                        }
                    >
                        Xóa
                    </button>
                </div>
            </div>
        );

        setExtraContent(
            <div className="space-y-6">
                <ZoneCreateForm zones={zones} isSaving={isSaving} onCreateZone={onCreateZone} />

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

        // Cố ý không dọn nội dung ở đây. Effect này chạy lại mỗi lần danh sách khu đổi, mà
        // dọn rồi dựng lại sẽ có một nhịp sidebar trống — đủ để form thêm khu bị gỡ khỏi DOM
        // và người dùng mất chữ đang gõ dở. Việc dọn để cho effect gỡ component bên dưới.

        // Danh sách khu và form phụ thuộc các state dưới đây; cố ý không đưa trạng thái kéo
        // vào deps để mỗi lần di chuột không phải dựng lại toàn bộ nội dung sidebar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setExtraContent, zones, unplacedZones, placedZones, colorByZoneId, isSaving, onCreateZone, onDeleteZone, onRenameZone]);

    // Rời khỏi trang mới trả sidebar về trạng thái trống.
    useEffect(() => () => setExtraContent(null), [setExtraContent]);

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
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="h-3.5 w-3.5 rounded border border-gray-300 bg-white" />
                        Khoảng trắng là <b>lối đi</b>, không phải chỗ trống chờ đặt khu
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="h-3.5 w-3.5 rounded border-2 border-dashed border-gray-300" />
                        Lưới ô chỉ hiện khi đang kéo khu
                    </span>
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
                {zones.length === 0 ? (
                    <div className="flex h-full min-h-56 items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Kho này chưa có khu vực nào</p>
                            <p className="mt-1 text-xs text-gray-500">Dùng ô "Thêm khu mới" ở sidebar bên trái để tạo khu đầu tiên.</p>
                        </div>
                    </div>
                ) : (
                    <div
                        ref={gridRef}
                        className="inline-grid select-none gap-1.5 rounded-3xl border border-gray-200 bg-white p-4 shadow-inner"
                        style={{ gridTemplateColumns: `repeat(${cols}, 68px)`, gridAutoRows: "64px" }}
                    >
                        {Array.from({ length: rows * cols }).map((_, index) => {
                            const row = Math.floor(index / cols);
                            const col = index % cols;
                            const key = `${row}:${col}`;
                            const zone = cellOwner.get(key);
                            const color = zone ? colorByZoneId.get(zone.id) : undefined;
                            const isAnchor = zone ? zone.gridRow === row && zone.gridCol === col : false;
                            const isPreview = previewCells.has(key);

                            // Khu chiếm nhiều ô được vẽ thành một khối liền từ ô gốc, các ô còn lại
                            // của khu không vẽ nữa. Trước đây mỗi ô tự vẽ nhãn riêng nên tên khu bị
                            // lặp lại bốn lần trên cùng một dãy kệ.
                            if (zone && !isAnchor) return null;
                            const span = zone ? sizeOf(zone) : 1;
                            const isHorizontal = zone?.gridOrientation === "HORIZONTAL";
                            const colSpan = zone && isHorizontal ? span : 1;
                            const rowSpan = zone && !isHorizontal ? span : 1;

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
                                    className={`relative flex items-center justify-center overflow-hidden rounded-2xl border-2 text-sm transition-colors ${zone
                                        ? "cursor-grab border-transparent shadow-sm active:cursor-grabbing"
                                        // Ô trống là lối đi, không phải chỗ chờ điền: để trắng hẳn cho
                                        // mặt bằng đọc ra hình khối kho. Lưới chấm chỉ hiện lúc đang
                                        // kéo khu, đủ để ngắm chỗ đặt rồi biến mất.
                                        : drag
                                            ? "border-dashed border-gray-300"
                                            : "border-transparent"
                                        } ${isPreview
                                            ? previewBlocked
                                                ? "border-red-400 bg-red-100"
                                                : "border-pink-500 bg-pink-100"
                                            : ""
                                        } ${zone && isZoneFull(zone) && !isPreview ? "border-solid border-red-400" : ""}`}
                                    style={{
                                        gridColumn: `${col + 1} / span ${colSpan}`,
                                        gridRow: `${row + 1} / span ${rowSpan}`,
                                        ...(zone && color && !isPreview ? { backgroundColor: `${color}25` } : null),
                                    }}
                                    title={
                                        zone
                                            ? `${labelOf(zone)} (mã ${zone.code}) - ${zone.shelfCount} kệ, ${zone.occupiedCount}/${zone.locationCount} ô đang có hàng${isZoneFull(zone) ? " (không còn ô trống để xếp hàng mới, không phải hết sức chứa)" : ""}`
                                            : `Lối đi H${row + 1}-C${col + 1}`
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
                                        <div className="pointer-events-none relative px-1.5 text-center">
                                            {/* Tên khu là nhãn duy nhất trên mặt bằng. Mã khu (A, B, C) chỉ
                                                còn nằm trong mã ô lưu trữ và trong tooltip, vì thủ kho tìm
                                                khu theo tên hàng chứ không theo chữ cái. */}
                                            <div className="break-words text-xs font-bold leading-tight" style={{ color }}>
                                                {labelOf(zone)}
                                            </div>
                                            <div className="mt-0.5 text-[10px] leading-none text-gray-500">
                                                {isZoneFull(zone) ? "hết ô trống" : `${zone.shelfCount} kệ`}
                                            </div>
                                        </div>
                                    ) : (
                                        // Lối đi: để trống hoàn toàn, chỉ đánh dấu tọa độ mờ khi đang kéo.
                                        drag && <span className="pointer-events-none text-[10px] text-gray-300">H{row + 1}-C{col + 1}</span>
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
                        aria-hidden
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: colorByZoneId.get(draggedZone.id) }}
                    />
                    <span className="max-w-[160px] truncate text-xs font-semibold text-gray-700">
                        {labelOf(draggedZone)}
                    </span>
                    <span className="text-xs text-gray-500">
                        {sizeOf(draggedZone)} ô · {drag.orientation === "HORIZONTAL" ? "ngang ↔" : "dọc ↕"}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">F: xoay</span>
                </div>
            )}
        </div>
    );
}
