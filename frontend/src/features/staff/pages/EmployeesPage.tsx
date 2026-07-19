import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";

interface User {
    MaNguoiDung: number;
    HoTen: string;
    MaNhanVien: string;
    Email: string;
    SoDienThoai: string;
    VaiTro: string;
    TrangThai: string;
}

export default function EmployeesPage() {
    const { setExtraContent } = useSidebar();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    // Dá»¯ liá»‡u máº«u dá»±a trÃªn schema SQL
    const data: User[] = [
        {
            MaNguoiDung: 1,
            HoTen: "Nguyá»…n VÄƒn Admin",
            MaNhanVien: "NV001",
            Email: "admin@bambi.vn",
            SoDienThoai: "0901234567",
            VaiTro: "Admin",
            TrangThai: "HoatDong"
        },
        {
            MaNguoiDung: 2,
            HoTen: "LÃª Thá»‹ Kho",
            MaNhanVien: "NV002",
            Email: "lekho@bambi.vn",
            SoDienThoai: "0907654321",
            VaiTro: "Quáº£n lÃ½ kho",
            TrangThai: "HoatDong"
        },
        {
            MaNguoiDung: 3,
            HoTen: "Tráº§n VÄƒn Kiá»ƒm",
            MaNhanVien: "NV003",
            Email: "vankiem@bambi.vn",
            SoDienThoai: "0988888888",
            VaiTro: "NhÃ¢n viÃªn kho",
            TrangThai: "TamKhoa"
        }
    ];

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Lá»c theo vai trÃ²</label>
                    <select
                        className="w-full text-sm border-gray-200 rounded-md focus:ring-pink-500 focus:border-pink-500 shadow-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="All">Táº¥t cáº£ vai trÃ²</option>
                        <option value="Admin">Admin</option>
                        <option value="Quáº£n lÃ½ kho">Quáº£n lÃ½ kho</option>
                        <option value="NhÃ¢n viÃªn kho">NhÃ¢n viÃªn kho</option>
                    </select>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, roleFilter]);

    const columns: ColumnProps<User>[] = [
        { key: "MaNhanVien", title: "MÃ£ NV", className: "font-medium text-gray-900" },
        { key: "HoTen", title: "Há» vÃ  tÃªn" },
        { key: "Email", title: "Email" },
        { key: "SoDienThoai", title: "Sá»‘ Ä‘iá»‡n thoáº¡i" },
        { key: "VaiTro", title: "Vai trÃ²" },
        {
            key: "TrangThai",
            title: "Tráº¡ng thÃ¡i",
            render: (val) => (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${val === "HoatDong" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>
                    {val === "HoatDong" ? "Äang hoáº¡t Ä‘á»™ng" : "Táº¡m khÃ³a"}
                </span>
            )
        },
        {
            key: "actions",
            title: "Thao tÃ¡c",
            render: () => <button className="text-pink-600 hover:text-pink-800 text-sm font-semibold">Quyá»n háº¡n</button>
        }
    ];

    const filteredData = data.filter(user =>
        (roleFilter === "All" || user.VaiTro === roleFilter) &&
        (user.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) || user.MaNhanVien.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Danh sÃ¡ch nhÃ¢n viÃªn há»‡ thá»‘ng</h1>
                    <button className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">
                        + ThÃªm nhÃ¢n viÃªn
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="text"
                        placeholder="TÃ¬m theo tÃªn hoáº·c mÃ£ nhÃ¢n viÃªn..."
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Tablelayout
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="MaNguoiDung"
                />
            </div>
        </DashboardLayout>
    );
}

