import { useState } from "react";
import type { Layer, Shelf, ViTriKho } from "@/features/locations/hooks/useWarehouse";

interface WarehouseGridProps {
    layers: Layer[];
    shelves: Shelf[];
    selectedZone: string;
    activeLocation: ViTriKho | null;
    setActiveLocation: (loc: ViTriKho) => void;
    getLocationInfo: (shelfCode: string, layerCode: string) => ViTriKho | undefined;
    onReorderShelves?: (sourceShelfId: string, targetShelfId: string) => void;
}

function getLocationStyle(status: ViTriKho["TrangThai"]) {
    if (status === "DangChua") {
        return "bg-orange-50 border-orange-300 hover:bg-orange-100 text-orange-800";
    }
    if (status === "Day") {
        return "bg-red-50 border-red-300 hover:bg-red-100 text-red-800";
    }
    return "bg-green-50 border-green-300 hover:bg-green-100 text-green-800";
}
function parseStoredProducts(value?: string): string[] {
    return (value ?? "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
}

function getLocationSummary(products: string[]): { primary: string; overflow: string } {
    if (products.length === 0) return { primary: "Trống", overflow: "" };
    if (products.length === 1) return { primary: products[0], overflow: "" };
    return { primary: products[0], overflow: `+${products.length - 1} mặt hàng` };
}

export default function WarehouseGrid({
    layers,
    shelves,
    selectedZone,
    activeLocation,
    setActiveLocation,
    getLocationInfo,
    onReorderShelves,
}: WarehouseGridProps) {
    const [draggedShelfId, setDraggedShelfId] = useState<string | null>(null);
    const [dragOverShelfId, setDragOverShelfId] = useState<string | null>(null);

    const handleShelfDrop = (targetShelfId: string) => {
        if (!draggedShelfId || draggedShelfId === targetShelfId) return;
        onReorderShelves?.(draggedShelfId, targetShelfId);
        setDraggedShelfId(null);
        setDragOverShelfId(null);
    };

    return (
        <main className="flex flex-1 flex-col items-center justify-start overflow-auto p-8">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-2 text-center text-base font-bold uppercase text-gray-600">Sơ đồ kệ/tầng trong khu</h3>
                <p className="mb-6 text-center text-xs text-gray-400">Mỗi cột là một kệ, mỗi hàng là một tầng. Bạn có thể kéo thả bất kỳ vị trí/kệ nào để đổi vị trí cột.</p>

                <div className="space-y-4">
                    {layers.map((layer) => (
                        <div key={layer.id} className="flex items-center gap-4">
                            <div className="w-20 text-right text-sm font-semibold text-gray-500">
                                {layer.name}
                            </div>

                            <div className="flex gap-4">
                                {shelves.map((shelf) => {
                                    const location = getLocationInfo(shelf.code, layer.code) ?? {
                                        MaViTri: 0,
                                        KhuVuc: selectedZone,
                                        Ke: shelf.code,
                                        Tang: layer.code,
                                        MaViTriCha: null,
                                        MaKe: Number(shelf.id) || 0,
                                        TrangThai: 'Trong' as const,
                                        SanPhamLuuTru: '',
                                    };
                                    const storedProducts = parseStoredProducts(location.SanPhamLuuTru);
                                    const productSummary = getLocationSummary(storedProducts);
                                    const isDragged = draggedShelfId === shelf.id;
                                    const isDragOver = dragOverShelfId === shelf.id && !isDragged;

                                    return (
                                        <button
                                            key={`${shelf.code}-${layer.code}`}
                                            type="button"
                                            draggable
                                            onDragStart={(event) => {
                                                setDraggedShelfId(shelf.id);
                                                event.dataTransfer.effectAllowed = "move";
                                                event.dataTransfer.setData("text/plain", shelf.id);
                                            }}
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                setDragOverShelfId(shelf.id);
                                            }}
                                            onDragLeave={() => setDragOverShelfId(null)}
                                            onDrop={() => handleShelfDrop(shelf.id)}
                                            onDragEnd={() => {
                                                setDraggedShelfId(null);
                                                setDragOverShelfId(null);
                                            }}
                                            onClick={() => location.MaViTri > 0 && setActiveLocation(location)}
                                            className={`flex h-24 w-32 cursor-grab active:cursor-grabbing flex-col items-center justify-center rounded-xl border-2 p-2 shadow-sm transition-all ${getLocationStyle(location.TrangThai)} ${activeLocation?.MaViTri === location.MaViTri && location.MaViTri > 0 ? "scale-105 ring-4 ring-pink-500" : ""} ${isDragged ? "opacity-40 scale-95 border-dashed border-pink-400" : ""} ${isDragOver ? "scale-105 ring-4 ring-pink-400 border-pink-500 bg-pink-100/70" : ""}`}
                                            title={`Kéo thả vị trí này để đổi thứ tự cột kệ (${selectedZone}-${location.Ke}-${location.Tang})\n` + (storedProducts.join("\n") || "Trống")}>
                                            <span className="text-xs font-bold tracking-wider">{selectedZone}-{location.Ke}-{location.Tang}</span>
                                            <span className="mt-1 max-w-full truncate text-[10px] font-semibold leading-tight">
                                                {productSummary.primary}
                                            </span>
                                            {productSummary.overflow && (
                                                <span className="mt-1 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                                                    {productSummary.overflow}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-4 pt-2">
                        <div className="w-20 text-right text-xs font-bold uppercase text-gray-400">Kệ</div>
                        <div className="flex gap-4">
                            {shelves.map((shelf) => (
                                <div
                                    key={shelf.id}
                                    draggable
                                    onDragStart={(event) => {
                                        setDraggedShelfId(shelf.id);
                                        event.dataTransfer.effectAllowed = "move";
                                        event.dataTransfer.setData("text/plain", shelf.id);
                                    }}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => handleShelfDrop(shelf.id)}
                                    onDragEnd={() => setDraggedShelfId(null)}
                                    className={`w-32 cursor-move rounded-md border border-transparent py-1 text-center text-sm font-semibold text-gray-500 hover:border-pink-200 hover:bg-pink-50 ${draggedShelfId === shelf.id ? "opacity-50" : ""}`}
                                    title="Kéo tên kệ để đổi thứ tự cột"
                                >
                                    {shelf.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}