import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { partnerService } from "@/features/partners/services/partnerService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import type { Partner } from "@/features/partners/services/partnerService";

type PartnerFilter = "All" | "NCC" | "KH";

const initialFormState = {
    TenNCC: "",
    NguoiLienHe: "",
    SoDienThoai: "",
    Email: ""
};

export default function Partners() {
    const { setExtraContent } = useSidebar();
    const [type, setType] = useState<PartnerFilter>("All");
    const [data, setData] = useState<Partner[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    /**
     * Tải danh sách đối tác / nhà cung cấp từ backend.
     * Cập nhật state `data`, `isLoading`, `error`.
     */
    async function loadPartners() {
        try {
            setIsLoading(true);
            setError(null);
            setData(await partnerService.listPartners());
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách đối tác từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadPartners(); }, []);

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase text-gray-500">Phân loại đối tác</label>
                <select className="w-full rounded-md border-gray-200 text-sm" value={type} onChange={(e) => setType(e.target.value as PartnerFilter)}>
                    <option value="All">Tất cả</option>
                    <option value="NCC">Nhà cung cấp</option>
                    <option value="KH">Khách hàng</option>
                </select>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, type]);

    /** Mở modal tạo mới đối tác — reset form về trạng thái rỗng. */
    const openCreateModal = () => {
        setEditingPartner(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    /**
     * Mở modal chỉnh sửa đối tác — điền sẵn thông tin của `partner` vào form.
     * @param partner - Bản ghi đối tác cần sửa.
     */
    const openEditModal = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData({
            TenNCC: partner.TenNCC,
            NguoiLienHe: partner.NguoiLienHe,
            SoDienThoai: partner.SoDienThoai,
            Email: partner.Email,
        });
        setShowModal(true);
    };

    /**
     * Xử lý submit form tạo mới / cập nhật đối tác.
     * - Nếu `editingPartner` tồn tại → gọi updatePartner.
     * - Nếu không → gọi createPartner.
     * Sau khi lưu xong: đóng modal, reset form, reload danh sách.
     */
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (editingPartner) {
            await partnerService.updatePartner(editingPartner.MaNCC, formData);
        } else {
            await partnerService.createPartner(formData);
        }
        setFormData(initialFormState);
        setEditingPartner(null);
        setShowModal(false);
        await loadPartners();
    };

    /**
     * Xóa đối tác sau khi người dùng xác nhận qua dialog.
     * @param id - Mã NCC (MaNCC) của đối tác cần xóa.
     */
    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa đối tác này?")) return;
        await partnerService.deletePartner(id);
        await loadPartners();
    };

    const columns: ColumnProps<Partner>[] = [
        { key: "MaNCC", title: "Mã NCC", className: "w-20" },
        { key: "TenNCC", title: "Tên nhà cung cấp", className: "font-semibold text-gray-900" },
        { key: "NguoiLienHe", title: "Người liên hệ" },
        { key: "SoDienThoai", title: "Số điện thoại" },
        { key: "Email", title: "Email" },
        {
            key: "actions",
            title: "Thao tác",
            width: "120px",
            render: (_, record) => (
                <div className="flex gap-1">
                    <button type="button" onClick={() => openEditModal(record)} className="btn-action btn-blue">Sửa</button>
                    <button type="button" onClick={() => handleDelete(record.MaNCC)} className="btn-action btn-red">Xóa</button>
                </div>
            )
        }
    ];

    const filtered = data.filter((partner) => type === "All" || partner.type === type);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý đối tác</h1>
                    <button type="button" onClick={openCreateModal} className="rounded-md bg-pink-600 px-4 py-2 text-sm text-white">+ Thêm đối tác</button>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                {isLoading ? <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Đang tải đối tác...</div> : <Tablelayout columns={columns} dataSource={filtered} rowKey="MaNCC" />}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">{editingPartner ? "Sửa đối tác" : "Thêm nhà cung cấp"}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tên nhà cung cấp</label>
                                <input required value={formData.TenNCC} onChange={(e) => setFormData({ ...formData, TenNCC: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Người liên hệ</label>
                                <input value={formData.NguoiLienHe} onChange={(e) => setFormData({ ...formData, NguoiLienHe: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
                                <input value={formData.SoDienThoai} onChange={(e) => setFormData({ ...formData, SoDienThoai: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" value={formData.Email} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu đối tác</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}