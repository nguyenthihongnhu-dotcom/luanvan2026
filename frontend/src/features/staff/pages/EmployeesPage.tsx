import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { roleLabel, userService } from "@/features/staff/services/userService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import type { User, UserRoleCode } from "@/features/staff/services/userService";

const roleOptions: Array<{ code: UserRoleCode; label: string }> = [
    { code: "ADMIN", label: roleLabel("ADMIN") },
    { code: "WAREHOUSE_MANAGER", label: roleLabel("WAREHOUSE_MANAGER") },
    { code: "STAFF", label: roleLabel("STAFF") },
    { code: "AUDITOR", label: roleLabel("AUDITOR") },
];

const initialFormState = {
    fullName: "",
    employeeCode: "",
    email: "",
    phone: "",
    password: "",
    roleCode: "STAFF" as UserRoleCode,
    status: "ACTIVE" as "ACTIVE" | "LOCKED" | "INACTIVE",
};

export default function EmployeesPage() {
    const { setExtraContent } = useSidebar();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [data, setData] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    /**
     * Tải danh sách nhân viên từ backend.
     * Cập nhật state `data`, `isLoading`, `error`.
     */
    async function loadUsers() {
        try {
            setIsLoading(true);
            setError(null);
            setData(await userService.listUsers());
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách nhân viên từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadUsers(); }, []);

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Lọc theo vai trò</label>
                    <select className="w-full text-sm border-gray-200 rounded-md" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="All">Tất cả vai trò</option>
                        {roleOptions.map((role) => <option key={role.code} value={role.label}>{role.label}</option>)}
                    </select>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, roleFilter]);

    /** Mở modal tạo mới nhân viên — reset form về trạng thái rỗng, mặc định vai trò STAFF. */
    const openCreateModal = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    /**
     * Mở modal chỉnh sửa nhân viên.
     * Map dữ liệu `User` sang cấu trúc form (bao gồm roleCode và status).
     * Trường `password` được reset về rỗng — chỉ submit nếu muốn thay mật khẩu.
     * @param user - Bản ghi nhân viên cần sửa.
     */
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            fullName: user.HoTen,
            employeeCode: user.MaNhanVien,
            email: user.Email,
            phone: user.SoDienThoai,
            password: "",
            roleCode: user.roleCode,
            status: user.TrangThai === "HoatDong" ? "ACTIVE" : "LOCKED",
        });
        setShowModal(true);
    };

    /**
     * Xử lý submit form tạo mới / cập nhật nhân viên.
     * - Nếu `editingUser` tồn tại → gọi updateUser.
     * - Nếu không → gọi createUser (yêu cầu quyền `users:create`).
     * Sau khi lưu: đóng modal, reset form, reload danh sách.
     */
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (editingUser) {
            await userService.updateUser(editingUser.MaNguoiDung, formData);
        } else {
            await userService.createUser(formData);
        }
        setShowModal(false);
        setEditingUser(null);
        setFormData(initialFormState);
        await loadUsers();
    };

    /**
     * Xóa tài khoản nhân viên sau khi xác nhận.
     * Yêu cầu quyền `users:delete`.
     * @param user - Bản ghi nhân viên cần xóa.
     */
    const handleDelete = async (user: User) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${user.HoTen}?`)) return;
        await userService.deleteUser(user.MaNguoiDung);
        await loadUsers();
    };

    const columns: ColumnProps<User>[] = [
        { key: "MaNhanVien", title: "Mã NV", className: "font-medium text-gray-900" },
        { key: "HoTen", title: "Họ và tên" },
        { key: "Email", title: "Email" },
        { key: "SoDienThoai", title: "Số điện thoại" },
        { key: "VaiTro", title: "Vai trò" },
        {
            key: "TrangThai",
            title: "Trạng thái",
            render: (val) => <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">{val === "HoatDong" ? "Đang hoạt động" : "Tạm khóa"}</span>,
        },
        {
            key: "actions",
            title: "Thao tác",
            width: "120px",
            render: (_, record) => (
                <div className="flex gap-1">
                    <button type="button" onClick={() => openEditModal(record)} className="btn-action btn-blue">Sửa</button>
                    <button type="button" onClick={() => handleDelete(record)} className="btn-action btn-red">Xóa</button>
                </div>
            ),
        },
    ];

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredData = data.filter(user =>
        (roleFilter === "All" || user.VaiTro === roleFilter) &&
        (user.HoTen.toLowerCase().includes(normalizedSearch) || user.MaNhanVien.toLowerCase().includes(normalizedSearch) || user.Email.toLowerCase().includes(normalizedSearch))
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Danh sách nhân viên hệ thống</h1>
                    <button type="button" onClick={openCreateModal} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">+ Thêm nhân viên</button>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input type="text" placeholder="Tìm theo tên, email hoặc mã nhân viên..." className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {isLoading ? <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Đang tải nhân viên...</div> : <Tablelayout columns={columns} dataSource={filteredData} rowKey="MaNguoiDung" />}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">{editingUser ? "Sửa nhân viên" : "Thêm nhân viên"}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên</label>
                                <input required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mã nhân viên</label>
                                <input value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} placeholder="Để trống để backend tự sinh" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Email đăng nhập</label>
                                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
                                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Vai trò</label>
                                <select value={formData.roleCode} onChange={(e) => setFormData({ ...formData, roleCode: e.target.value as UserRoleCode })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
                                </select>
                            </div>
                            {editingUser && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                        <option value="ACTIVE">Đang hoạt động</option>
                                        <option value="LOCKED">Tạm khóa</option>
                                        <option value="INACTIVE">Ngưng hoạt động</option>
                                    </select>
                                </div>
                            )}
                            {!editingUser && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
                                    <input required type="password" minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu nhân viên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}