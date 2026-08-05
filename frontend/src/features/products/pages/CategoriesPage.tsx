import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { useForm } from "@/shared/hooks/useForm";
import { categoryService } from "@/features/products/services/categoryService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import type { Category } from "@/features/products/services/categoryService";

const initialFormState = { name: "" };

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);

    /**
     * Tải danh sách danh mục sản phẩm từ backend.
     * Cập nhật state `categories`, `isLoading`, `error`.
     */
    async function loadCategories() {
        setIsLoading(true);
        try {
            setError(null);
            setCategories(await categoryService.listCategories());
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh mục từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadCategories(); }, []);

    /**
     * Xử lý submit form tạo mới / cập nhật danh mục.
     * - Nếu `editingCategory` tồn tại → gọi updateCategory.
     * - Nếu không → gọi createCategory.
     * Sau khi lưu: reload danh sách, đóng modal, reset form.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory.id, formData.name);
            } else {
                await categoryService.createCategory(formData.name);
            }
            await loadCategories();
            setShowModal(false);
            setEditingCategory(null);
            resetForm();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không lưu được danh mục"));
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Mở modal chỉnh sửa danh mục — điền sẵn tên danh mục vào form.
     * @param category - Danh mục cần sửa.
     */
    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setShowModal(true);
    };

    /**
     * Xóa danh mục sau khi người dùng xác nhận.
     * Danh mục đã có sản phẩm sẽ bị backend từ chối xóa.
     * @param id - ID của danh mục cần xóa.
     */
    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        setIsSaving(true);
        try {
            await categoryService.deleteCategory(id);
            await loadCategories();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không xóa được danh mục"));
        } finally {
            setIsSaving(false);
        }
    };

    const columns: ColumnProps<Category>[] = [
        { key: "id", title: "ID" },
        { key: "name", title: "Tên danh mục" },
        {
            key: "actions",
            title: "Thao tác",
            width: "120px",
            render: (_, record) => (
                <div className="flex gap-1">
                    <button type="button" onClick={() => handleEdit(record)} disabled={isSaving} className="btn-action btn-blue">Sửa</button>
                    <button type="button" onClick={() => void handleDelete(record.id)} disabled={isSaving} className="btn-action btn-red">Xóa</button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý danh mục sản phẩm</h1>
                    <button type="button" onClick={() => { setEditingCategory(null); resetForm(); setShowModal(true); }} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700">+ Thêm danh mục</button>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <Tablelayout columns={columns} dataSource={categories} rowKey="id" isLoading={isLoading} />
            </div>
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-80 p-4 backdrop-blur-md">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tên danh mục</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" placeholder="Ví dụ: Sữa công thức" />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={isSaving} className="flex-2 rounded-md bg-pink-600 px-8 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isSaving ? "Đang lưu..." : "Lưu danh mục"}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </DashboardLayout>
    );
}