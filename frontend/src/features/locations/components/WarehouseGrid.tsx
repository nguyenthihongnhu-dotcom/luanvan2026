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

    const handleShelfDrop = (targetShelfId: string) => {
        if (!draggedShelfId || draggedShelfId === targetShelfId) return;
        onReorderShelves?.(draggedShelfId, targetShelfId);
        setDraggedShelfId(null);
    };

    return (
        <main className="flex flex-1 flex-col items-center justify-start overflow-auto p-8">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-2 text-center text-base font-bold uppercase text-gray-600">Mô hình mặt đứng dãy kệ</h3>
                <p className="mb-6 text-center text-xs text-gray-400">Kéo tiêu đề kệ hoặc một cột kệ rồi thả sang vị trí khác để đổi thứ tự.</p>

                <div className="space-y-4">
                    {layers.map((layer) => (
                        <div key={layer.id} className="flex items-center gap-4">
                            <div className="w-20 text-right text-sm font-semibold text-gray-500">
                                {layer.name}
                            </div>

                            <div className="flex gap-4">
                                {shelves.map((shelf) => {
                                    const location = getLocationInfo(shelf.code, layer.code);
                                    if (!location) return null;

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
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => handleShelfDrop(shelf.id)}
                                            onDragEnd={() => setDraggedShelfId(null)}
                                            onClick={() => setActiveLocation(location)}
                                            className={`flex h-20 w-28 cursor-move flex-col items-center justify-center rounded-xl border-2 p-2 shadow-sm transition-all ${getLocationStyle(location.TrangThai)} ${activeLocation?.MaViTri === location.MaViTri ? "scale-105 ring-4 ring-pink-500" : ""} ${draggedShelfId === shelf.id ? "opacity-50" : ""}`}
                                            title="Kéo cột kệ này để đổi thứ tự"
                                        >
                                            <span className="text-xs font-bold tracking-wider">{selectedZone}-{location.Ke}-{location.Tang}</span>
                                            <span className="mt-1 max-w-full truncate text-[10px] font-medium">
                                                {location.SanPhamLuuTru || "Trống"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-4 pt-2">
                        <div className="w-20" />
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
                                    className={`w-28 cursor-move rounded-md border border-transparent py-1 text-center text-sm font-semibold text-gray-500 hover:border-pink-200 hover:bg-pink-50 ${draggedShelfId === shelf.id ? "opacity-50" : ""}`}
                                    title="Kéo để đổi thứ tự kệ"
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