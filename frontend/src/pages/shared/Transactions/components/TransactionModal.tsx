import React from "react";
import type { TransactionItem } from "../../../../hooks/useTransactions";

interface TransactionModalProps {
    editingTransaction: any;
    formData: {
        soPhieu: string;
        loai: "NHAP" | "XUAT" | "DIEU_CHINH";
        ngay: string;
        status: string;
        nguoiTao: string;
        maNCC: string;
        maDonHangThamChieu: string;
        maTonKho: string;
        soLuongCu: string;
        soLuongMoi: string;
        lyDo: string;
        nguoiPheDuyet: string;
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    items: TransactionItem[];
    handleAddItemRow: () => void;
    handleRemoveItemRow: (index: number) => void;
    handleItemChange: (index: number, field: keyof TransactionItem, value: string) => void;
}

const categories = ["Bỉm tã", "Sữa công thức", "Đồ sơ sinh"];

const emptyShelves = [
    { value: "A-01-02", label: "Kệ 01 - Tầng 02 (A-01-02)" },
    { value: "A-02-01", label: "Kệ 02 - Tầng 01 (A-02-01)" },
    { value: "A-02-03", label: "Kệ 02 - Tầng 03 (A-02-03)" },
    { value: "A-03-01", label: "Kệ 03 - Tầng 01 (A-03-01)" },
    { value: "A-03-02", label: "Kệ 03 - Tầng 02 (A-03-02)" },
    { value: "A-03-03", label: "Kệ 03 - Tầng 03 (A-03-03)" }
];

export default function TransactionModal({
    editingTransaction,
    formData,
    handleInputChange,
    handleSubmit,
    onClose,
    items,
    handleAddItemRow,
    handleRemoveItemRow,
    handleItemChange,
}: TransactionModalProps) {
    const isNhap = formData.loai === "NHAP";
    const modalWidth = isNhap ? "max-w-4xl" : "max-w-md";
    const gridCols = isNhap ? "grid-cols-2" : "grid-cols-1";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-80 p-4 backdrop-blur-md">
            <div className={`bg-white rounded-xl shadow-xl w-full ${modalWidth} overflow-hidden animate-in fade-in zoom-in duration-200`}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-pink-50">
                    <h2 className="text-lg font-bold text-pink-700">
                        {editingTransaction ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className={`grid ${gridCols} gap-4`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số phiếu</label>
                            <input
                                type="text"
                                name="soPhieu"
                                required
                                value={formData.soPhieu}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                            <select
                                name="loai"
                                value={formData.loai}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                            >
                                <option value="NHAP">Phiếu Nhập Kho</option>
                                <option value="XUAT">Phiếu Xuất Kho</option>
                                <option value="DIEU_CHINH">Phiếu Điều Chỉnh</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.loai === "NHAP" ? "Ngày nhập" : formData.loai === "XUAT" ? "Ngày xuất" : "Ngày thực hiện"}
                            </label>
                            <input
                                type="date"
                                name="ngay"
                                required
                                value={formData.ngay}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                            />
                        </div>

                        {/* Trường dữ liệu riêng cho Phiếu Nhập */}
                        {formData.loai === "NHAP" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhà cung cấp</label>
                                <input
                                    type="text"
                                    name="maNCC"
                                    value={formData.maNCC}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mã NCC..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                />
                            </div>
                        )}

                        {/* Trường dữ liệu riêng cho Phiếu Xuất */}
                        {formData.loai === "XUAT" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng tham chiếu</label>
                                <input
                                    type="text"
                                    name="maDonHangThamChieu"
                                    value={formData.maDonHangThamChieu}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mã đơn hàng..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                />
                            </div>
                        )}

                        {/* Trường dữ liệu riêng cho Phiếu Điều Chỉnh */}
                        {formData.loai === "DIEU_CHINH" && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã tồn kho</label>
                                    <input
                                        type="text"
                                        name="maTonKho"
                                        value={formData.maTonKho}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng cũ</label>
                                        <input
                                            type="number"
                                            name="soLuongCu"
                                            value={formData.soLuongCu}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng mới</label>
                                        <input
                                            type="number"
                                            name="soLuongMoi"
                                            value={formData.soLuongMoi}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Người phê duyệt</label>
                                    <input
                                        type="text"
                                        name="nguoiPheDuyet"
                                        value={formData.nguoiPheDuyet}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do điều chỉnh</label>
                                    <textarea
                                        name="lyDo"
                                        value={formData.lyDo}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm min-h-[80px]"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo</label>
                            <input
                                type="text"
                                name="nguoiTao"
                                value={formData.nguoiTao}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                            />
                        </div>

                        {/* Các dòng sản phẩm động cho Phiếu Nhập */}
                        {isNhap && (
                            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-semibold text-pink-700">Chi tiết sản phẩm nhập</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItemRow}
                                        className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-200 px-3 py-1.5 rounded-lg transition-colors font-semibold border border-pink-200 shadow-sm"
                                    >
                                        + Thêm dòng
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                                            <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 font-bold flex items-center justify-center text-xs border border-pink-100 flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Mã SKU (vd: BIM-HUG-M)"
                                                required
                                                value={item.sku}
                                                onChange={(e) => handleItemChange(index, "sku", e.target.value)}
                                                className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 bg-white rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Tên sản phẩm"
                                                required
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, "name", e.target.value)}
                                                className="flex-[1.5] min-w-0 px-3 py-1.5 border border-gray-300 bg-white rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                            />
                                            <select
                                                required
                                                value={item.category}
                                                onChange={(e) => handleItemChange(index, "category", e.target.value)}
                                                className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 bg-white rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                            >
                                                <option value="">Chọn danh mục</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <select
                                                required
                                                value={item.shelf}
                                                onChange={(e) => handleItemChange(index, "shelf", e.target.value)}
                                                className="flex-[1.5] min-w-0 px-3 py-1.5 border border-gray-300 bg-white rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                            >
                                                <option value="">Chọn kệ trống</option>
                                                {emptyShelves.map(shelf => (
                                                    <option key={shelf.value} value={shelf.label}>{shelf.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItemRow(index)}
                                                className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                                                title="Xóa dòng"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-2 bg-pink-600 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors"
                        >
                            Lưu giao dịch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

