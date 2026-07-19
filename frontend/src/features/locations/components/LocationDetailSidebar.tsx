import type { ViTriKho } from "@/features/locations/hooks/useWarehouse";

interface LocationDetailSidebarProps {
    activeLocation: ViTriKho;
    setActiveLocation: (loc: ViTriKho | null) => void;
    selectedZone: string;
}

export default function LocationDetailSidebar({
    activeLocation,
    setActiveLocation,
    selectedZone,
}: LocationDetailSidebarProps) {
    return (
        <div className="w-80 bg-white border-l border-gray-200 p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900">ThÃ´ng tin vá»‹ trÃ­</h3>
                    <button
                        onClick={() => setActiveLocation(null)}
                        className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                    >
                        ÄÃ³ng
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="text-xs text-gray-400 block font-medium">MÃ£ ID / Tá»a Äá»™</label>
                        <p className="text-2xl font-black text-pink-600 tracking-wider">
                            {selectedZone}-{activeLocation.Ke}-{activeLocation.Tang}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">Há»‡ thá»‘ng ID: #{activeLocation.MaViTri}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block font-medium">Tráº¡ng ThÃ¡i (SQL)</label>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 uppercase ${activeLocation.TrangThai === 'Trong' ? 'bg-green-100 text-green-800' :
                            activeLocation.TrangThai === 'DangChua' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {activeLocation.TrangThai === 'Trong' ? 'Trong' : activeLocation.TrangThai === 'DangChua' ? 'Äang Chá»©a' : 'ÄÃ£ Äáº§y'}
                        </span>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block font-medium">Sáº£n pháº©m lÆ°u trá»¯ hiá»‡n táº¡i</label>
                        <p className="font-semibold text-gray-700 mt-0.5">{activeLocation.SanPhamLuuTru || 'ChÆ°a cÃ³ hÃ ng hÃ³a'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <button className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg text-sm transition">
                    Xem Lá»‹ch Sá»­ Nháº­p/Xuáº¥t
                </button>
                <button className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition">
                    In nhÃ£n Barcode/QR Code
                </button>
            </div>
        </div>
    );
}

