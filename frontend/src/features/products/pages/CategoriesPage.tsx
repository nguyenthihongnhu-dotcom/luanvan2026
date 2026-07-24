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
    const [error, setError] = useState<string | null>(null);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);

    async function loadCategories() {
        try {
            setError(null);
            setCategories(await categoryService.listCategories());
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh mục từ backend"));
        }
    }

    useEffect(() => { void loadCategories(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            await categoryService.updateCategory(editingCategory.id, formData.name);
        } else {
            await categoryService.createCategory(formData.name);
        }
        await loadCategories();
        setShowModal(false);
        setEditingCategory(null);
        resetForm();
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        await categoryService.deleteCategory(id);
        await loadCategories();
    };

    const columns: ColumnProps<Category>[] = [
        { key: "id", title: "ID" },
        { key: "name", title: "Tên danh mục" },
        { key: "actions", title: "Thao tác", className: "text-right", render: (_, record) => <div className="flex justify-end space-x-2"><button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-900 text-xs font-medium">Sửa</button><button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900 text-xs font-medium">Xóa</button></div> },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý danh mục sản phẩm</h1>
                    <button onClick={() => { setEditingCategory(null); resetForm(); setShowModal(true); }} className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">+ Thêm danh mục</button>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <Tablelayout columns={columns} dataSource={categories} rowKey="id" />
            </div>
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-80 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-pink-50">
                            <h2 className="text-lg font-bold text-pink-700">{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" placeholder="Ví dụ: Sữa công thức" />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">Hủy</button>
                                <button type="submit" className="flex-2 bg-pink-600 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-pink-700">Lưu danh mục</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </DashboardLayout>
    );
}