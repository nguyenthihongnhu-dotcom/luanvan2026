import type { Layer, Shelf } from "@/features/locations/hooks/useWarehouse";

interface StructureSidebarProps {
    selectedZone: string;
    shelves: Shelf[];
    layers: Layer[];
    isSaving?: boolean;
    handleAddShelf: () => void;
    handleAddLayer: () => void;
    handleSyncMatrix: () => void;
    handleDeleteShelf: (shelfId: string, shelfCode: string) => void;
    handleDeleteLayer: (layerId: string, layerCode: string) => void;
}

export default function StructureSidebar({
    selectedZone,
    shelves,
    layers,
    isSaving = false,
    handleAddShelf,
    handleAddLayer,
    handleSyncMatrix,
    handleDeleteShelf,
    handleDeleteLayer,
}: StructureSidebarProps) {
    function confirmDeleteShelf(shelf: Shelf) {
        handleDeleteShelf(shelf.id, shelf.code);
    }

    function confirmDeleteLayer(layer: Layer) {
        handleDeleteLayer(layer.id, layer.code);
    }

    return (
        <aside className="w-80 overflow-y-auto border-r border-gray-200 bg-white p-4">
            <div className="space-y-4">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Cấu trúc khu {selectedZone}</h2>
                    <p className="mt-1 text-xs leading-5 text-gray-500">Kệ là cột ngang. Tầng là hàng dọc và áp dụng cho toàn bộ kệ trong khu.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase text-gray-500">Số kệ</div>
                        <div className="text-xl font-bold text-gray-900">{shelves.length}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase text-gray-500">Số tầng</div>
                        <div className="text-xl font-bold text-gray-900">{layers.length}</div>
                    </div>
                </div>

                <div className="rounded-lg border border-pink-100 bg-pink-50 p-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-pink-700">Thêm và đồng bộ cấu trúc</h3>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <button
                            type="button"
                            onClick={handleAddShelf}
                            disabled={isSaving}
                            className="rounded-lg bg-pink-600 px-3 py-2 text-left text-xs font-bold text-white shadow-sm transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? "Đang lưu..." : "+ Thêm 1 kệ mới"}
                            <span className="block text-[11px] font-normal text-pink-100">Tạo thêm một cột kệ trong khu.</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleAddLayer}
                            disabled={isSaving}
                            className="rounded-lg border border-pink-300 bg-white px-3 py-2 text-left text-xs font-bold text-pink-700 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? "Đang lưu..." : "+ Thêm 1 tầng toàn khu"}
                            <span className="block text-[11px] font-normal text-pink-500">Tạo thêm một hàng tầng cho tất cả kệ.</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSyncMatrix}
                            disabled={isSaving || shelves.length === 0 || layers.length === 0}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? "Đang lưu..." : "Đồng bộ ma trận"}
                            <span className="block text-[11px] font-normal text-slate-500">Lấp các ô kệ/tầng đang thiếu trong khu.</span>
                        </button>
                    </div>
                </div>

                <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Kệ (cột ngang)</h3>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{shelves.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {shelves.length === 0 ? (
                            <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">Chưa có kệ trong khu này.</p>
                        ) : (
                            shelves.map((shelf) => (
                                <div key={shelf.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-gray-800">{shelf.name}</div>
                                        <div className="text-[11px] text-gray-500">Mã kệ: {shelf.code}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => confirmDeleteShelf(shelf)}
                                        disabled={isSaving}
                                        className="shrink-0 rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Xóa kệ
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Tầng (hàng dọc)</h3>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{layers.length}</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-gray-500">Xóa tầng sẽ xóa tầng đó trên tất cả kệ trong khu. Backend sẽ chặn nếu tầng còn hàng.</p>
                    <div className="mt-3 space-y-2">
                        {layers.length === 0 ? (
                            <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">Chưa có tầng trong khu này.</p>
                        ) : (
                            layers.map((layer) => (
                                <div key={layer.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-gray-800">{layer.name}</div>
                                        <div className="text-[11px] text-gray-500">Mã tầng: {layer.code}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => confirmDeleteLayer(layer)}
                                        disabled={isSaving}
                                        className="shrink-0 rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Xóa tầng
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </aside>
    );
}
