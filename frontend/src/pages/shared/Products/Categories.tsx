import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../../../layout/Dashboardlayout";
import Tablelayout from "../../../components/Table/Tablelayout";
import type { ColumnProps } from "../../../components/Table/types";
import { useSidebar } from "../../../context/Sidebarcontext";
import { useForm } from "../../../hooks/useForm";
interface Category {
    id: number;
    name: string;
}

const initialFormState = { name: "" };

export default function Categories() {
    const { setExtraContent } = useSidebar();
    const [categories, setCategories] = useState<Category[]>([
        { id: 1, name: "Sữa công thức" },
        { id: 2, name: "Bỉm tã" },
        { id: 3, name: "Đồ sơ sinh" },
        { id: 4, name: "Dinh dưỡng" },
    ]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const {
        formData,
        setFormData,
        handleInputChange,
        resetForm
    } = useForm(initialFormState);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            // Cập nhật danh mục
            setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: formData.name } : c));
            alert("Cập nhật danh mục thành công!");
        } else {
            // Thêm mới danh mục
            const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
            setCategories([...categories, { id: newId, name: formData.name }]);
            alert("Thêm danh mục thành công!");
        }
        setShowModal(false);
        setEditingCategory(null);
        resetForm();
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            setCategories(categories.filter(c => c.id !== id));
            alert("Xóa danh mục thành công!");
        }
    };

    const columns: ColumnProps<Category>[] = [
        { key: "id", title: "ID" },
        { key: "name", title: "Tên Danh Mục" },
        {
            key: "actions",
            title: "Thao tác",
            className: "text-right",
            render: (_, record: Category) => (
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                    >
                        Sửa
                    </button>
                    <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900 text-xs font-medium"
                    >
                        Xóa
                    </button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Quản lý Danh Mục Sản Phẩm</h1>
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">
                        + Thêm danh mục
                    </button>
                </div>

                <Tablelayout
                    columns={columns}
                    dataSource={categories}
                    rowKey="id"
                />
            </div>

            {/* Popup Thêm/Sửa Danh Mục */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-80 p-4 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-pink-50">
                            <h2 className="text-lg font-bold text-pink-700">
                                {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                    placeholder="Ví dụ: Sữa công thức"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingCategory(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                                >Hủy</button>
                                <button type="submit" className="flex-2 bg-pink-600 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors">Lưu danh mục</button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body)}
        </DashboardLayout>
    );


}
