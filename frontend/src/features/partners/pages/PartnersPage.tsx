import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";

type PartnerFilter = "All" | "NCC" | "KH";

interface Partner {
    MaNCC: number;
    TenNCC: string;
    NguoiLienHe: string;
    Email: string;
    SoDienThoai: string;
    type: "NCC" | "KH"; 
}

export default function Partners() {
    const { setExtraContent } = useSidebar();
    const [type, setType] = useState<PartnerFilter>("All");

    const data: Partner[] = [
        { MaNCC: 1, TenNCC: "CÃƒÂ´ng ty SÃ¡Â»Â¯a Vinamilk", NguoiLienHe: "BÃƒ  NguyÃ¡Â»â€¦n ThÃ¡Â»â€¹ Mai", type: "NCC", SoDienThoai: "028383838", Email: "contact@vinamilk.vn" },
        { MaNCC: 2, TenNCC: "Ã„ÂÃ¡ÂºÂ¡i lÃƒÂ½ MÃ¡ÂºÂ¹ & BÃƒÂ© HÃƒ  NÃ¡Â»â„¢i", NguoiLienHe: "Ãƒâ€ng TrÃ¡ÂºÂ§n VÃ„Æ’n BÃƒÂ¬nh", type: "NCC", SoDienThoai: "0909123456", Email: "vanbinh@dv.com" },
    ];

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase">PhÃƒÂ¢n loÃ¡ÂºÂ¡i Ã„â€˜Ã¡Â»â€˜i tÃƒÂ¡c</label>
                <select className="w-full text-sm border-gray-200 rounded-md" onChange={(e) => setType(e.target.value as PartnerFilter)}>
                    <option value="All">TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£</option>
                    <option value="NCC">NhÃƒ  cung cÃ¡ÂºÂ¥p</option>
                    <option value="KH">KhÃƒÂ¡ch hÃƒ ng</option>
                </select>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent]);

    const columns: ColumnProps<Partner>[] = [
        { key: "MaNCC", title: "MÃƒÂ£ NCC", className: "w-20" },
        { key: "TenNCC", title: "TÃƒÂªn NhÃƒ  Cung CÃ¡ÂºÂ¥p", className: "font-semibold text-gray-900" },
        { key: "NguoiLienHe", title: "NgÃ†Â°Ã¡Â»Âi LiÃƒÂªn HÃ¡Â»â€¡" },
        { key: "SoDienThoai", title: "SÃ¡Â»â€˜ Ã„ÂiÃ¡Â»â€¡n ThoÃ¡ÂºÂ¡i" },
        { key: "Email", title: "Email" },
        { key: "actions", title: "Thao tÃƒÂ¡c", render: () => <button className="text-pink-600 hover:text-pink-800 font-medium">SÃ¡Â»Â­a</button> }
    ];

    const filtered = data.filter(d => type === "All" || d.type === type);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">QuÃ¡ÂºÂ£n lÃƒÂ½ Ã„ÂÃ¡Â»â€˜i tÃƒÂ¡c</h1>
                    <button className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm">+ ThÃƒÂªm Ã„â€˜Ã¡Â»â€˜i tÃƒÂ¡c</button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <input
                        type="text" placeholder="TÃƒÂ¬m theo tÃƒÂªn, email, sÃ„â€˜t..."
                        className="w-full md:w-1/3 px-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                <Tablelayout
                    columns={columns}
                    dataSource={filtered}
                    rowKey="MaNCC"
                />
            </div>
        </DashboardLayout>
    );
}

