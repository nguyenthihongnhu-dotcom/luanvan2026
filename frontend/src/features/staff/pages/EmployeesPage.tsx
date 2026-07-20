import { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { userService } from "@/features/staff/services/userService";
import type { User } from "@/features/staff/services/userService";

const roleOptions = ["Admin", "Quản lý kho", "Nhân viên kho", "Kiểm toán"];

export default function EmployeesPage() {
    const { setExtraContent } = useSidebar();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [data, setData] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setError(null);
                setData(await userService.listUsers());
            } catch (err) {
                console.error(err);
                setError("Không tải được danh sách nhân viên từ backend.");
            }
        }
        void load();
    }, []);

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Lọc theo vai trò</label>
                    <select className="w-full text-sm border-gray-200 rounded-md" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="All">Tất cả vai trò</option>
                        {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
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
        { key: "TrangThai", title: "Trạng thái", render: (val) => <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">{val === "HoatDong" ? "Đang hoạt động" : "Tạm khóa"}</span> },
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
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input type="text" placeholder="Tìm theo tên hoặc mã nhân viên..." className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Tablelayout columns={columns} dataSource={filteredData} rowKey="MaNguoiDung" />
            </div>
        </DashboardLayout>
    );
}