import { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/Dashboardlayout";
import Tablelayout from "../../../components/Table/Tablelayout";
import { useSidebar } from "../../../context/Sidebarcontext";
import type { ColumnProps } from "../../../components/Table/types";

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
    const [type, setType] = useState<"All" | "NCC" | "KH">("All");

    const data: Partner[] = [
        { MaNCC: 1, TenNCC: "Công ty Sữa Vinamilk", NguoiLienHe: "Bà Nguyễn Thị Mai", type: "NCC", SoDienThoai: "028383838", Email: "contact@vinamilk.vn" },
        { MaNCC: 2, TenNCC: "Đại lý Mẹ & Bé Hà Nội", NguoiLienHe: "Ông Trần Văn Bình", type: "NCC", SoDienThoai: "0909123456", Email: "vanbinh@dv.com" },
    ];

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase">Phân loại đối tác</label>
                <select className="w-full text-sm border-gray-200 rounded-md" onChange={(e) => setType(e.target.value as any)}>
                    <option value="All">Tất cả</option>
                    <option value="NCC">Nhà cung cấp</option>
                    <option value="KH">Khách hàng</option>
                </select>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent]);

    const columns: ColumnProps<Partner>[] = [
        { key: "MaNCC", title: "Mã NCC", className: "w-20" },
        { key: "TenNCC", title: "Tên Nhà Cung Cấp", className: "font-semibold text-gray-900" },
        { key: "NguoiLienHe", title: "Người Liên Hệ" },
        { key: "SoDienThoai", title: "Số Điện Thoại" },
        { key: "Email", title: "Email" },
        { key: "actions", title: "Thao tác", render: () => <button className="text-pink-600 hover:text-pink-800 font-medium">Sửa</button> }
    ];

    const filtered = data.filter(d => type === "All" || d.type === type);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý Đối tác</h1>
                    <button className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm">+ Thêm đối tác</button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <input
                        type="text" placeholder="Tìm theo tên, email, sđt..."
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