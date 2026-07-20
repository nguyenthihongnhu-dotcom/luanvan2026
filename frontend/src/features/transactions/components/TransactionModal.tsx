import React from "react";
import type { Transaction, TransactionItem } from "@/features/transactions/hooks/useTransactions";
import { productCategoryOptions } from "@/features/products/utils/productDisplay";

interface TransactionModalProps {
    editingTransaction: Transaction | null;
    formData: { soPhieu: string; loai: "NHAP" | "XUAT" | "DIEU_CHINH"; ngay: string; status: string; nguoiTao: string; maNCC: string; maDonHangThamChieu: string; maTonKho: string; soLuongCu: string; soLuongMoi: string; lyDo: string; nguoiPheDuyet: string; };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    items: TransactionItem[];
    handleAddItemRow: () => void;
    handleRemoveItemRow: (index: number) => void;
    handleItemChange: (index: number, field: keyof TransactionItem, value: string) => void;
}

const emptyShelves = [
    { value: "A-01-02", label: "Kệ 01 - Tầng 02 (A-01-02)" },
    { value: "A-02-01", label: "Kệ 02 - Tầng 01 (A-02-01)" },
    { value: "A-02-03", label: "Kệ 02 - Tầng 03 (A-02-03)" },
];

export default function TransactionModal({ editingTransaction, formData, handleInputChange, handleSubmit, onClose, items, handleAddItemRow, handleRemoveItemRow, handleItemChange }: TransactionModalProps) {
    const isReceipt = formData.loai === "NHAP";
    const modalWidth = isReceipt ? "max-w-4xl" : "max-w-md";
    const gridCols = isReceipt ? "grid-cols-2" : "grid-cols-1";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
            <div className={`w-full ${modalWidth} overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200`}>
                <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                    <h2 className="text-lg font-bold text-pink-700">{editingTransaction ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div className={`grid ${gridCols} gap-4`}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Số phiếu</label>
                            <input type="text" name="soPhieu" required value={formData.soPhieu} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Loại giao dịch</label>
                            <select name="loai" value={formData.loai} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="NHAP">Phiếu nhập kho</option>
                                <option value="XUAT">Phiếu xuất kho</option>
                                <option value="DIEU_CHINH">Phiếu điều chỉnh</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{formData.loai === "NHAP" ? "Ngày nhập" : formData.loai === "XUAT" ? "Ngày xuất" : "Ngày thực hiện"}</label>
                            <input type="date" name="ngay" required value={formData.ngay} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        {formData.loai === "NHAP" && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mã nhà cung cấp</label>
                                <input type="text" name="maNCC" value={formData.maNCC} onChange={handleInputChange} placeholder="Nhập mã NCC..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                        )}
                        {formData.loai === "XUAT" && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mã đơn hàng tham chiếu</label>
                                <input type="text" name="maDonHangThamChieu" value={formData.maDonHangThamChieu} onChange={handleInputChange} placeholder="Nhập mã đơn hàng..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                        )}
                        {formData.loai === "DIEU_CHINH" && (
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Mã tồn kho</label>
                                    <input type="text" name="maTonKho" value={formData.maTonKho} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Lý do điều chỉnh</label>
                                    <textarea name="lyDo" value={formData.lyDo} onChange={handleInputChange} className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Người tạo</label>
                            <input type="text" name="nguoiTao" value={formData.nguoiTao} onChange={handleInputChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        {isReceipt && (
                            <div className="col-span-2 mt-2 border-t border-gray-200 pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-pink-700">Chi tiết sản phẩm nhập</label>
                                    <button type="button" onClick={handleAddItemRow} className="rounded-lg border border-pink-200 bg-pink-100 px-3 py-1.5 text-xs font-semibold text-pink-700 shadow-sm hover:bg-pink-200">+ Thêm dòng</button>
                                </div>
                                <div className="max-h-[250px] space-y-3 overflow-y-auto pr-1">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-pink-100 bg-pink-50 text-xs font-bold text-pink-600">{index + 1}</div>
                                            <input type="text" placeholder="Mã SKU" required value={item.sku} onChange={(e) => handleItemChange(index, "sku", e.target.value)} className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500" />
                                            <input type="text" placeholder="Tên sản phẩm" required value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} className="min-w-0 flex-[1.5] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500" />
                                            <select required value={item.category} onChange={(e) => handleItemChange(index, "category", e.target.value)} className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500">
                                                <option value="">Chọn danh mục</option>
                                                {productCategoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                                            </select>
                                            <select required value={item.shelf} onChange={(e) => handleItemChange(index, "shelf", e.target.value)} className="min-w-0 flex-[1.5] rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-pink-500">
                                                <option value="">Chọn kệ trống</option>
                                                {emptyShelves.map((shelf) => <option key={shelf.value} value={shelf.label}>{shelf.label}</option>)}
                                            </select>
                                            <button type="button" onClick={() => handleRemoveItemRow(index)} className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700">Xóa</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 border-t border-gray-100 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu giao dịch</button>
                    </div>
                </form>
            </div>
        </div>
    );
}