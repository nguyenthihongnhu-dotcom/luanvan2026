import React from "react";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import type { LocationOption } from "@/features/products/services/productService";
import { productCategoryOptions } from "@/features/products/utils/productDisplay";

interface ProductModalProps {
    editingProduct: ProductItem | null;
    formData: { sku: string; name: string; category: string; stock: string; minStock: string; expiryDate: string; warehouseId: string; locationId: string; };
    locationOptions: LocationOption[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export default function ProductModal({ editingProduct, formData, locationOptions, handleInputChange, handleSubmit, onClose }: ProductModalProps) {
    const stockValue = Number(formData.stock || 0);
    const hasExistingLocation = Boolean(editingProduct?.locations);
    const warehouseOptions = Array.from(
        new Map(locationOptions.map((location) => [location.warehouseId, location.warehouseLabel])).entries(),
    ).map(([id, label]) => ({ id, label }));
    const filteredLocationOptions = formData.warehouseId
        ? locationOptions.filter((location) => String(location.warehouseId) === formData.warehouseId)
        : [];
    const shouldRequireStockPlace = stockValue > 0 && !hasExistingLocation;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                    <h2 className="text-lg font-bold text-pink-700">{editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                </div>
                <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Mã SKU</label>
                        <input type="text" name="sku" required value={formData.sku} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" placeholder="Ví dụ: BIM-HUG-L" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Danh mục</label>
                        <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                            <option value="">Chọn danh mục</option>
                            {productCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Số lượng</label>
                            <input type="number" name="stock" required min="0" value={formData.stock} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Tồn kho tối thiểu</label>
                            <input type="number" name="minStock" required min="0" value={formData.minStock} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Kho nhập ban đầu</label>
                        <select name="warehouseId" required={shouldRequireStockPlace} disabled={hasExistingLocation || warehouseOptions.length === 0} value={formData.warehouseId} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100 disabled:text-gray-500">
                            <option value="">Chọn kho</option>
                            {warehouseOptions.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Vị trí nhập ban đầu</label>
                        <select name="locationId" required={shouldRequireStockPlace} disabled={hasExistingLocation || !formData.warehouseId || filteredLocationOptions.length === 0} value={formData.locationId} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100 disabled:text-gray-500">
                            <option value="">Chọn vị trí</option>
                            {filteredLocationOptions.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Hạn sử dụng</label>
                        <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu sản phẩm</button>
                    </div>
                </form>
            </div>
        </div>
    );
}