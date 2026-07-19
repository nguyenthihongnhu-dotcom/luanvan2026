import type { Shelf, Layer } from "@/features/locations/hooks/useWarehouse";

interface StructureSidebarProps {
    selectedZone: string;
    shelves: Shelf[];
    layers: Layer[];
    handleAddShelf: () => void;
    handleAddLayer: () => void;
    handleDeleteShelf: (shelfId: string, shelfCode: string) => void;
    handleDeleteLayer: (layerId: string, layerCode: string) => void;
}

export default function StructureSidebar({
    selectedZone,
    shelves,
    layers,
    handleAddShelf,
    handleAddLayer,
    handleDeleteShelf,
    handleDeleteLayer,
}: StructureSidebarProps) {
    return (
        <div className="w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h2 className="font-semibold text-sm text-gray-500 uppercase mb-3">Cáº¥u trÃºc nhanh</h2>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleAddShelf}
                        className="py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg text-[11px] uppercase transition shadow-sm"
                    >
                        + ThÃªm Ká»‡
                    </button>
                    <button
                        onClick={handleAddLayer}
                        className="py-2 bg-white border border-pink-600 text-pink-600 hover:bg-pink-50 font-medium rounded-lg text-[11px] uppercase transition shadow-sm"
                    >
                        + ThÃªm Táº§ng
                    </button>
                </div>

                {/* Tree cáº¥u trÃºc tÆ°á»£ng trÆ°ng */}
                <div className="border border-gray-100 rounded-lg p-2 bg-gray-50 text-sm">
                    <p className="font-bold text-pink-600">ðŸ“ Khu vá»±c {selectedZone}</p>
                    <div className="pl-4 mt-2 space-y-2">
                        {shelves.map((shelf) => (
                            <div key={shelf.id} className="border-l-2 border-gray-300 pl-2">
                                <div className="flex justify-between items-center group">
                                    <span className="font-medium">ðŸ¬ {shelf.name}</span>
                                    <button
                                        onClick={() => handleDeleteShelf(shelf.id, shelf.code)}
                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="pl-4 text-xs text-gray-500 space-y-1 mt-1">
                                    {layers.map((layer) => (
                                        <div key={layer.id} className="flex justify-between items-center group/layer pr-2">
                                            <p>â¹ï¸ {layer.name}</p>
                                            <button
                                                onClick={() => handleDeleteLayer(layer.id, layer.code)}
                                                className="text-red-300 hover:text-red-500 opacity-0 group-hover/layer:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

