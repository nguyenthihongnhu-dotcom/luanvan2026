import { formatQuantity } from '@/shared/utils/number';
import { useDateFormatter } from "@/shared/hooks";
import type { Transaction } from "@/features/transactions/hooks/useTransactions";

interface TransactionDetailModalProps {
    selectedTransaction: Transaction;
    onClose: () => void;
}

export default function TransactionDetailModal({ selectedTransaction, onClose }: TransactionDetailModalProps) {
    const { formatDate } = useDateFormatter();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-80 p-4 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-pink-50">
                    <h2 className="text-lg font-bold text-pink-700 uppercase tracking-wide">Chi tiết giao dịch</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                </div>

                <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div className="space-y-1">
                        <p className="text-gray-500">Mã phiếu:</p>
                        <p className="font-semibold text-gray-800">{selectedTransaction.soPhieu}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-500">Ngày thực hiện:</p>
                        <p className="font-semibold text-gray-800">{formatDate(selectedTransaction.ngay)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-500">Loại giao dịch:</p>
                        <p className="font-semibold text-gray-800">{selectedTransaction.loai}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-500">Người tạo phiếu:</p>
                        <p className="font-semibold text-gray-800">{selectedTransaction.nguoiTao}</p>
                    </div>

                    <div className="col-span-2 space-y-2 border-t border-gray-100 pt-4">
                        <p className="text-gray-500 font-medium">Dòng hàng chi tiết:</p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                            {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                selectedTransaction.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-5 gap-2 text-xs py-1 border-b border-gray-100 last:border-0">
                                        <span className="font-semibold text-gray-800">Variant #{item.productVariantId}</span>
                                        <span>Batch: {item.batchId || "-"}</span>
                                        <span>Vị trí: #{item.locationId}</span>
                                        <span>SL: {formatQuantity(item.quantity)}</span>
                                        <span>{selectedTransaction.loai === "DIEU_CHINH" ? (item.adjustmentDirection === "IN" ? "Tăng" : "Giảm") : item.note}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 text-xs italic">Không có dòng hàng chi tiết trong dữ liệu list.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button type="button" onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm">Đóng</button>
                </div>
            </div>
        </div>
    );
}