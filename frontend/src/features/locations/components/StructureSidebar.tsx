import type { Layer, Shelf } from "@/features/locations/hooks/useWarehouse";

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
        <aside className="w-72 overflow-y-auto border-r border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Cấu trúc nhanh</h2>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={handleAddShelf}
                        className="rounded-lg bg-pink-600 py-2 text-[11px] font-medium uppercase text-white shadow-sm transition hover:bg-pink-700"
                    >
                        + Thêm kệ
                    </button>
                    <button
                        type="button"
                        onClick={handleAddLayer}
                        className="rounded-lg border border-pink-600 bg-white py-2 text-[11px] font-medium uppercase text-pink-600 shadow-sm transition hover:bg-pink-50"
                    >
                        + Thêm tầng
                    </button>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
                    <p className="font-bold text-pink-600">Khu vực {selectedZone}</p>
                    <div className="mt-2 space-y-2 pl-4">
                        {shelves.map((shelf) => (
                            <div key={shelf.id} className="border-l-2 border-gray-300 pl-2">
                                <div className="group flex items-center justify-between">
                                    <span className="font-medium">{shelf.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteShelf(shelf.id, shelf.code)}
                                        className="text-red-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                                        title="Xóa kệ"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-1 space-y-1 pl-4 pr-2 text-xs text-gray-500">
                                    {layers.map((layer) => (
                                        <div key={layer.id} className="group/layer flex items-center justify-between">
                                            <p>{layer.name}</p>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLayer(layer.id, layer.code)}
                                                className="text-red-300 opacity-0 transition-opacity hover:text-red-500 group-hover/layer:opacity-100"
                                                title="Xóa tang"
                                            >
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </aside>
    );
}
