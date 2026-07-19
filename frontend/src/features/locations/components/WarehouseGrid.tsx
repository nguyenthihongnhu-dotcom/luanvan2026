import type { Layer, Shelf, ViTriKho } from "@/features/locations/hooks/useWarehouse";

interface WarehouseGridProps {
    layers: Layer[];
    shelves: Shelf[];
    selectedZone: string;
    activeLocation: ViTriKho | null;
    setActiveLocation: (loc: ViTriKho) => void;
    getLocationInfo: (shelfCode: string, layerCode: string) => ViTriKho | undefined;
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
        <div className="flex-1 p-8 overflow-auto flex flex-col items-center justify-start">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-center font-bold text-base mb-8 text-gray-600 uppercase">MÃ´ hÃ¬nh máº·t Ä‘á»©ng dÃ£y ká»‡</h3>

                <div className="space-y-4">
                    {/* VÃ²ng láº·p theo cÃ¡c Táº§ng tá»« cao xuá»‘ng tháº¥p (Trá»¥c Y) */}
                    {layers.map((layer) => (
                        <div key={layer.id} className="flex items-center gap-4">
                            {/* Cá»™t hiá»ƒn thá»‹ tÃªn Táº§ng á»Ÿ rÃ¬a trÃ¡i */}
                            <div className="w-20 text-right font-semibold text-sm text-gray-500">
                                {layer.name}
                            </div>

                            {/* VÃ²ng láº·p hiá»ƒn thá»‹ cÃ¡c Ká»‡ theo hÃ ng ngang (Trá»¥c X) */}
                            <div className="flex gap-4">
                                {shelves.map((shelf) => {
                                    const location = getLocationInfo(shelf.code, layer.code);
                                    if (!location) return null;

                                    // Äá»‹nh dáº¡ng mÃ u sáº¯c dá»±a trÃªn status
                                    let bgClass = 'bg-green-50 border-green-300 hover:bg-green-100 text-green-800';
                                    if (location.TrangThai === 'DangChua') bgClass = 'bg-orange-50 border-orange-300 hover:bg-orange-100 text-orange-800';
                                    if (location.TrangThai === 'Day') bgClass = 'bg-red-50 border-red-300 hover:bg-red-100 text-red-800';

                                    return (
                                        <button
                                            key={`${shelf.code}-${layer.code}`}
                                            onClick={() => setActiveLocation(location)}
                                            className={`w-28 h-20 border-2 rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all shadow-sm ${bgClass} ${activeLocation?.MaViTri === location.MaViTri ? 'ring-4 ring-pink-500 scale-105' : ''}`}
                                        >
                                            <span className="text-xs font-bold tracking-wider">{selectedZone}-{location.Ke}-{location.Tang}</span>
                                            <span className="text-[10px] mt-1 truncate max-w-full font-medium">
                                                {location.SanPhamLuuTru ? location.SanPhamLuuTru : 'Trá»‘ng'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* DÃ²ng hiá»ƒn thá»‹ tÃªn Ká»‡ á»Ÿ dÆ°á»›i Ä‘Ã¡y sÆ¡ Ä‘á»“ */}
                    <div className="flex items-center gap-4 pt-2">
                        <div className="w-20"></div> {/* Khoáº£ng trá»‘ng bÃ¹ dÃ²ng táº§ng */}
                        <div className="flex gap-4">
                            {shelves.map((shelf) => (
                                <div key={shelf.id} className="w-28 text-center font-semibold text-sm text-gray-500">
                                    {shelf.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

