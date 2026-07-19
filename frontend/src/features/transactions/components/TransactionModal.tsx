import React from "react";
import type { Transaction, TransactionItem } from "@/features/transactions/hooks/useTransactions";

interface TransactionModalProps {
    editingTransaction: Transaction | null;
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

const categories = ["BÃ¡Â»â€°m tÃƒÂ£", "SÃ¡Â»Â¯a cÃƒÂ´ng thÃ¡Â»Â©c", "Ã„ÂÃ¡Â»â€œ sÃ†Â¡ sinh"];

const emptyShelves = [
    { value: "A-01-02", label: "KÃ¡Â»â€¡ 01 - TÃ¡ÂºÂ§ng 02 (A-01-02)" },
    { value: "A-02-01", label: "KÃ¡Â»â€¡ 02 - TÃ¡ÂºÂ§ng 01 (A-02-01)" },
    { value: "A-02-03", label: "KÃ¡Â»â€¡ 02 - TÃ¡ÂºÂ§ng 03 (A-02-03)" },
    { value: "A-03-01", label: "KÃ¡Â»â€¡ 03 - TÃ¡ÂºÂ§ng 01 (A-03-01)" },
    { value: "A-03-02", label: "KÃ¡Â»â€¡ 03 - TÃ¡ÂºÂ§ng 02 (A-03-02)" },
    { value: "A-03-03", label: "KÃ¡Â»â€¡ 03 - TÃ¡ÂºÂ§ng 03 (A-03-03)" }
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
                        {editingTransaction ? "ChÃ¡Â»â€°nh sÃ¡Â»Â­a giao dÃ¡Â»â€¹ch" : "ThÃƒÂªm giao dÃ¡Â»â€¹ch mÃ¡Â»â€ºi"}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">SÃ¡Â»â€˜ phiÃ¡ÂºÂ¿u</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">LoÃ¡ÂºÂ¡i giao dÃ¡Â»â€¹ch</label>
                            <select
                                name="loai"
                                value={formData.loai}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                            >
                                <option value="NHAP">PhiÃ¡ÂºÂ¿u NhÃ¡ÂºÂ­p Kho</option>
                                <option value="XUAT">PhiÃ¡ÂºÂ¿u XuÃ¡ÂºÂ¥t Kho</option>
                                <option value="DIEU_CHINH">PhiÃ¡ÂºÂ¿u Ã„ÂiÃ¡Â»Âu ChÃ¡Â»â€°nh</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.loai === "NHAP" ? "NgÃƒ y nhÃ¡ÂºÂ­p" : formData.loai === "XUAT" ? "NgÃƒ y xuÃ¡ÂºÂ¥t" : "NgÃƒ y thÃ¡Â»Â±c hiÃ¡Â»â€¡n"}
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

                        {/* TrÃ†Â°Ã¡Â»Âng dÃ¡Â»Â¯ liÃ¡Â»â€¡u riÃƒÂªng cho PhiÃ¡ÂºÂ¿u NhÃ¡ÂºÂ­p */}
                        {formData.loai === "NHAP" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">MÃƒÂ£ nhÃƒ  cung cÃ¡ÂºÂ¥p</label>
                                <input
                                    type="text"
                                    name="maNCC"
                                    value={formData.maNCC}
                                    onChange={handleInputChange}
                                    placeholder="NhÃ¡ÂºÂ­p mÃƒÂ£ NCC..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                />
                            </div>
                        )}

                        {/* TrÃ†Â°Ã¡Â»Âng dÃ¡Â»Â¯ liÃ¡Â»â€¡u riÃƒÂªng cho PhiÃ¡ÂºÂ¿u XuÃ¡ÂºÂ¥t */}
                        {formData.loai === "XUAT" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">MÃƒÂ£ Ã„â€˜Ã†Â¡n hÃƒ ng tham chiÃ¡ÂºÂ¿u</label>
                                <input
                                    type="text"
                                    name="maDonHangThamChieu"
                                    value={formData.maDonHangThamChieu}
                                    onChange={handleInputChange}
                                    placeholder="NhÃ¡ÂºÂ­p mÃƒÂ£ Ã„â€˜Ã†Â¡n hÃƒ ng..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                />
                            </div>
                        )}

                        {/* TrÃ†Â°Ã¡Â»Âng dÃ¡Â»Â¯ liÃ¡Â»â€¡u riÃƒÂªng cho PhiÃ¡ÂºÂ¿u Ã„ÂiÃ¡Â»Âu ChÃ¡Â»â€°nh */}
                        {formData.loai === "DIEU_CHINH" && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">MÃƒÂ£ tÃ¡Â»â€œn kho</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng cÃ…Â©</label>
                                        <input
                                            type="number"
                                            name="soLuongCu"
                                            value={formData.soLuongCu}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SÃ¡Â»â€˜ lÃ†Â°Ã¡Â»Â£ng mÃ¡Â»â€ºi</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NgÃ†Â°Ã¡Â»Âi phÃƒÂª duyÃ¡Â»â€¡t</label>
                                    <input
                                        type="text"
                                        name="nguoiPheDuyet"
                                        value={formData.nguoiPheDuyet}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">LÃƒÂ½ do Ã„â€˜iÃ¡Â»Âu chÃ¡Â»â€°nh</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">NgÃ†Â°Ã¡Â»Âi tÃ¡ÂºÂ¡o</label>
                            <input
                                type="text"
                                name="nguoiTao"
                                value={formData.nguoiTao}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                            />
                        </div>

                        {/* CÃƒÂ¡c dÃƒÂ²ng sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m Ã„â€˜Ã¡Â»â„¢ng cho PhiÃ¡ÂºÂ¿u NhÃ¡ÂºÂ­p */}
                        {isNhap && (
                            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-semibold text-pink-700">Chi tiÃ¡ÂºÂ¿t sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m nhÃ¡ÂºÂ­p</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItemRow}
                                        className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-200 px-3 py-1.5 rounded-lg transition-colors font-semibold border border-pink-200 shadow-sm"
                                    >
                                        + ThÃƒÂªm dÃƒÂ²ng
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
                                                placeholder="MÃƒÂ£ SKU (vd: BIM-HUG-M)"
                                                required
                                                value={item.sku}
                                                onChange={(e) => handleItemChange(index, "sku", e.target.value)}
                                                className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 bg-white rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                            />
                                            <input
                                                type="text"
                                                placeholder="TÃƒÂªn sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m"
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
                                                <option value="">ChÃ¡Â»Ân danh mÃ¡Â»Â¥c</option>
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
                                                <option value="">ChÃ¡Â»Ân kÃ¡Â»â€¡ trÃ¡Â»â€˜ng</option>
                                                {emptyShelves.map(shelf => (
                                                    <option key={shelf.value} value={shelf.label}>{shelf.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItemRow(index)}
                                                className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                                                title="XÃƒÂ³a dÃƒÂ²ng"
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
                            HÃ¡Â»Â§y
                        </button>
                        <button
                            type="submit"
                            className="flex-2 bg-pink-600 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors"
                        >
                            LÃ†Â°u giao dÃ¡Â»â€¹ch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



