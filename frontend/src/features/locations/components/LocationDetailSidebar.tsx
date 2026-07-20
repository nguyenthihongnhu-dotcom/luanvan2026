import type { ViTriKho } from "@/features/locations/hooks/useWarehouse";

interface LocationDetailSidebarProps {
    activeLocation: ViTriKho;
    setActiveLocation: (loc: ViTriKho | null) => void;
    selectedZone: string;
}

function getStatusLabel(status: ViTriKho["TrangThai"]) {
    if (status === "DangChua") return "Đang chứa";
    if (status === "Day") return "Đã đầy";
    return "Trống";
}

export default function LocationDetailSidebar({
    activeLocation,
    setActiveLocation,
    selectedZone,
}: LocationDetailSidebarProps) {
    return (
        <aside className="flex w-80 animate-in flex-col justify-between border-l border-gray-200 bg-white p-5 shadow-2xl duration-300 slide-in-from-right">
            <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h3 className="text-lg font-bold text-gray-900">Thong tin vi tri</h3>
                    <button
                        type="button"
                        onClick={() => setActiveLocation(null)}
                        className="text-sm font-bold text-gray-400 hover:text-gray-600"
                    >
                        Đóng
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-400">Mã ID / Tọa độ</label>
                        <p className="text-2xl font-black tracking-wider text-pink-600">
                            {selectedZone}-{activeLocation.Ke}-{activeLocation.Tang}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">Hệ thống ID: #{activeLocation.MaViTri}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400">Trạng thái</label>
                        <span className={`mt-1 inline-block rounded px-2 py-1 text-xs font-bold uppercase ${activeLocation.TrangThai === "Trong" ? "bg-green-100 text-green-800" :
                            activeLocation.TrangThai === "DangChua" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                            }`}>
                            {getStatusLabel(activeLocation.TrangThai)}
                        </span>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400">Sản phẩm lưu trữ hiện tại</label>
                        <p className="mt-0.5 font-semibold text-gray-700">{activeLocation.SanPhamLuuTru || "Chưa có hàng hóa"}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <button type="button" className="w-full rounded-lg bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700">
                    Xem lịch sử nhập/xuất
                </button>
                <button type="button" className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
                    In nhãn Barcode/QR Code
                </button>
            </div>
        </aside>
    );
}
