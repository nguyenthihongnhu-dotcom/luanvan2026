interface ZoneSelectorProps {
    selectedZone: string | null;
    setSelectedZone: (zone: string | null) => void;
}

export default function ZoneSelector({ selectedZone, setSelectedZone }: ZoneSelectorProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                {selectedZone && (
                    <button
                        type="button"
                        onClick={() => setSelectedZone(null)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-pink-600"
                        title="Quay lại bản đồ tổng thể"
                    >
                        Quay lại bản đồ
                    </button>
                )}

                <h1 className="flex items-center gap-1.5 text-lg font-bold uppercase tracking-tight text-gray-900">
                    <span>Sơ đồ cấu trúc kho</span>
                    {selectedZone && (
                        <span className="rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-sm font-bold text-pink-600">
                            Zone {selectedZone}
                        </span>
                    )}
                </h1>

                <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />

                <select
                    value={selectedZone || "map"}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "map") {
                            setSelectedZone(null);
                        } else if (val === "add") {
                            const name = window.prompt("Nhập mã phân khu mới (VD: F):");
                            if (name) {
                                setSelectedZone(name.trim().toUpperCase());
                            }
                        } else {
                            setSelectedZone(val);
                        }
                    }}
                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                    <option value="map">Bản đồ tổng thể</option>
                    <option value="A">Khu vực A (Zone A)</option>
                    <option value="B">Khu vực B (Zone B)</option>
                    <option value="C">Khu vực C (Zone C)</option>
                    <option value="D">Khu vực D (Zone D)</option>
                    <option value="E">Khu vực E (Zone E)</option>
                    <option value="add">Thêm khu vực mới</option>
                </select>
            </div>

            <div className="flex gap-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded border border-green-400 bg-green-100 shadow-sm" />
                    <span>Trống</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded border border-orange-400 bg-orange-100 shadow-sm" />
                    <span>Đang chứa</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded border border-red-400 bg-red-100 shadow-sm" />
                    <span>Đầy</span>
                </div>
            </div>
        </div>
    );
}
