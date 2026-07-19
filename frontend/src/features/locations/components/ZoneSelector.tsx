interface ZoneSelectorProps {
    selectedZone: string | null;
    setSelectedZone: (zone: string | null) => void;
}

export default function ZoneSelector({ selectedZone, setSelectedZone }: ZoneSelectorProps) {
    return (
        <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm gap-4">
            <div className="flex items-center gap-3">
                {/* Nút quay lại bản đồ tổng thể khi đang ở view chi tiết */}
                {selectedZone && (
                    <button
                        onClick={() => setSelectedZone(null)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-pink-600 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-200 shadow-sm cursor-pointer"
                        title="Quay lại Bản đồ tổng thể"
                    >
                        Quay lại Bản đồ
                    </button>
                )}

                <h1 className="text-lg font-bold text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span>Sơ đồ cấu trúc kho</span>
                    {selectedZone && (
                        <span className="text-sm font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                            Zone {selectedZone}
                        </span>
                    )}
                </h1>

                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                <select
                    value={selectedZone || "map"}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "map") {
                            setSelectedZone(null);
                        } else if (val === "add") {
                            const name = window.prompt("Nhập mã phân khu mới (vd: F):");
                            if (name) {
                                setSelectedZone(name.trim().toUpperCase());
                            }
                        } else {
                            setSelectedZone(val);
                        }
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-semibold text-slate-700 bg-white cursor-pointer"
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
                    <span className="w-3.5 h-3.5 bg-green-100 border border-green-400 rounded shadow-sm"></span>
                    <span>Trống</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-orange-100 border border-orange-400 rounded shadow-sm"></span>
                    <span>Đang chứa</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-red-100 border border-red-400 rounded shadow-sm"></span>
                    <span>Đầy</span>
                </div>
            </div>
        </div>
    );
}
