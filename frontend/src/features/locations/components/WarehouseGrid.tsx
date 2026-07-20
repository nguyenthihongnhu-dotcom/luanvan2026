import type { Layer, Shelf, ViTriKho } from "@/features/locations/hooks/useWarehouse";

interface WarehouseGridProps {
    layers: Layer[];
    shelves: Shelf[];
    selectedZone: string;
    activeLocation: ViTriKho | null;
    setActiveLocation: (loc: ViTriKho) => void;
    getLocationInfo: (shelfCode: string, layerCode: string) => ViTriKho | undefined;
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
}: WarehouseGridProps) {
    return (
        <main className="flex flex-1 flex-col items-center justify-start overflow-auto p-8">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-8 text-center text-base font-bold uppercase text-gray-600">Mô hình mặt đứng dãy kệ</h3>

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
                                            onClick={() => setActiveLocation(location)}
                                            className={`flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-2 shadow-sm transition-all ${getLocationStyle(location.TrangThai)} ${activeLocation?.MaViTri === location.MaViTri ? "scale-105 ring-4 ring-pink-500" : ""}`}
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
                                <div key={shelf.id} className="w-28 text-center text-sm font-semibold text-gray-500">
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
