import React from "react";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import { productCategoryOptions } from "@/features/products/utils/productDisplay";

interface ProductModalProps {
    editingProduct: ProductItem | null;
    formData: {
        sku: string;
        name: string;
        category: string;
        stock: string;
        minStock: string;
        expiryDate: string;
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export default function ProductModal({
    editingProduct,
    formData,
    handleInputChange,
    handleSubmit,
    onClose,
}: ProductModalProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-pink-50">
                    <h2 className="text-lg font-bold text-pink-700">
                        {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã SKU</label>
                        <input type="text" name="sku" required value={formData.sku} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" placeholder="Ví dụ: BIM-HUG-L" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm">
                            <option value="">Chọn danh mục</option>
                            {productCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                            <input type="number" name="stock" required value={formData.stock} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho tối thiểu</label>
                            <input type="number" name="minStock" required value={formData.minStock} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" className="flex-2 bg-pink-600 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors">Lưu sản phẩm</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
