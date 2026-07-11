import { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/Dashboardlayout";
import Tablelayout from "../../../components/Table/Tablelayout";
import { useSidebar } from "../../../context/Sidebarcontext";
import type { ColumnProps } from "../../../components/Table/types";

interface User {
    MaNguoiDung: number;
    HoTen: string;
    MaNhanVien: string;
    Email: string;
    SoDienThoai: string;
    VaiTro: string;
    TrangThai: string;
}

export function Employees() {
    const { setExtraContent } = useSidebar();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    // Dữ liệu mẫu dựa trên schema SQL
    const data: User[] = [
        {
            MaNguoiDung: 1,
            HoTen: "Nguyễn Văn Admin",
            MaNhanVien: "NV001",
            Email: "admin@bambi.vn",
            SoDienThoai: "0901234567",
            VaiTro: "Admin",
            TrangThai: "HoatDong"
        },
        {
            MaNguoiDung: 2,
            HoTen: "Lê Thị Kho",
            MaNhanVien: "NV002",
            Email: "lekho@bambi.vn",
            SoDienThoai: "0907654321",
            VaiTro: "Quản lý kho",
            TrangThai: "HoatDong"
        },
        {
            MaNguoiDung: 3,
            HoTen: "Trần Văn Kiểm",
            MaNhanVien: "NV003",
            Email: "vankiem@bambi.vn",
            SoDienThoai: "0988888888",
            VaiTro: "Nhân viên kho",
            TrangThai: "TamKhoa"
        }
    ];

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Lọc theo vai trò</label>
                    <select
                        className="w-full text-sm border-gray-200 rounded-md focus:ring-pink-500 focus:border-pink-500 shadow-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="All">Tất cả vai trò</option>
                        <option value="Admin">Admin</option>
                        <option value="Quản lý kho">Quản lý kho</option>
                        <option value="Nhân viên kho">Nhân viên kho</option>
                    </select>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, roleFilter]);

    const columns: ColumnProps<User>[] = [
        { key: "MaNhanVien", title: "Mã NV", className: "font-medium text-gray-900" },
        { key: "HoTen", title: "Họ và tên" },
        { key: "Email", title: "Email" },
        { key: "SoDienThoai", title: "Số điện thoại" },
        { key: "VaiTro", title: "Vai trò" },
        {
            key: "TrangThai",
            title: "Trạng thái",
            render: (val) => (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${val === "HoatDong" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>
                    {val === "HoatDong" ? "Đang hoạt động" : "Tạm khóa"}
                </span>
            )
        },
        {
            key: "actions",
            title: "Thao tác",
            render: () => <button className="text-pink-600 hover:text-pink-800 text-sm font-semibold">Quyền hạn</button>
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
                    <h1 className="text-xl font-bold text-gray-800">Danh sách nhân viên hệ thống</h1>
                    <button className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">
                        + Thêm nhân viên
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc mã nhân viên..."
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