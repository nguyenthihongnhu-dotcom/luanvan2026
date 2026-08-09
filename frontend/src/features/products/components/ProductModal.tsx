import React from "react";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import { productCategoryOptions } from "@/features/products/utils/productDisplay";

interface ProductModalProps {
    editingProduct: ProductItem | null;
    formData: { sku: string; name: string; category: string; minStock: string; requiresLotTracking: boolean; requiresExpiryTracking: boolean };
    categoryOptions?: string[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export default function ProductModal({ editingProduct, formData, categoryOptions, handleInputChange, handleSubmit, onClose }: ProductModalProps) {
    const categoriesToRender = categoryOptions && categoryOptions.length > 0 ? categoryOptions : productCategoryOptions;

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
                            {categoriesToRender.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Tồn kho tối thiểu</label>
                        <input type="number" name="minStock" required min="0" value={formData.minStock} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <p className="mt-1 text-xs text-gray-500">Ngưỡng để hệ thống cảnh báo sắp hết hàng.</p>
                    </div>

                    {/* Hai cờ này quyết định lúc NHẬP KHO có bắt buộc khai lô và hạn dùng không.
                        Ngày cụ thể vẫn nhập ở phiếu nhập theo từng lô, không nhập tại đây. */}
                    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                        <label className="flex items-start gap-2.5 text-sm text-gray-700">
                            <input type="checkbox" name="requiresLotTracking" checked={formData.requiresLotTracking} onChange={handleInputChange} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                            <span>
                                <span className="font-medium">Theo dõi theo lô</span>
                                <span className="block text-xs text-gray-500">Khi nhập kho phải khai số lô. Bật cho hầu hết hàng Mẹ &amp; Bé.</span>
                            </span>
                        </label>
                        <label className="flex items-start gap-2.5 text-sm text-gray-700">
                            <input type="checkbox" name="requiresExpiryTracking" checked={formData.requiresExpiryTracking} onChange={handleInputChange} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                            <span>
                                <span className="font-medium">Theo dõi hạn sử dụng</span>
                                <span className="block text-xs text-gray-500">Khi nhập kho phải khai hạn dùng. Bật cho sữa, bột ăn dặm, thực phẩm.</span>
                            </span>
                        </label>
                    </div>

                    {/* Danh mục chỉ khai báo sản phẩm. Số lượng, vị trí và hạn dùng
                        đều sinh ra từ phiếu nhập kho và lô hàng, không nhập ở đây. */}
                    {editingProduct ? (
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Tồn hiện tại</span>
                                <span className="font-semibold text-gray-900">{editingProduct.stock.toLocaleString("vi-VN")}</span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-gray-600">Hạn dùng gần nhất</span>
                                <span className="font-semibold text-gray-900">
                                    {editingProduct.expiryDate
                                        ? new Intl.DateTimeFormat("vi-VN").format(new Date(editingProduct.expiryDate))
                                        : "Không theo hạn dùng"}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Hai giá trị này chỉ để xem. Tồn thay đổi qua phiếu nhập, xuất, chuyển hoặc điều chỉnh;
                                hạn dùng lấy theo lô hết hạn sớm nhất còn trong kho.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                            Sản phẩm mới bắt đầu với tồn kho <strong>0</strong>. Số lượng, vị trí lưu và hạn sử dụng sẽ có
                            khi bạn lập <strong>phiếu nhập kho</strong> cho sản phẩm này.
                        </div>
                    )}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu sản phẩm</button>
                    </div>
                </form>
            </div>
        </div>
    );
}