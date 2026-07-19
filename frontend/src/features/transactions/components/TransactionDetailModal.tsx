
import { useDateFormatter } from "@/shared/hooks";
import type { Transaction } from "@/features/transactions/hooks/useTransactions";

interface TransactionDetailModalProps {
    selectedTransaction: Transaction;
    onClose: () => void;
}

export default function TransactionDetailModal({
    selectedTransaction,
    onClose,
}: TransactionDetailModalProps) {
    const { formatDate } = useDateFormatter();
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-opacity-80 p-4 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-pink-50">
                    <h2 className="text-lg font-bold text-pink-700 uppercase tracking-wide">
                        Chi tiáº¿t {selectedTransaction.loai === "NHAP" ? "Phiáº¿u Nháº­p Kho" : "Giao dá»‹ch"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div className="space-y-1">
                        <p className="text-gray-500">MÃ£ phiáº¿u:</p>
                        <p className="font-semibold text-gray-800">{selectedTransaction.soPhieu}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-500">NgÃ y thá»±c hiá»‡n:</p>
                        <p className="font-semibold text-gray-800">{formatDate(selectedTransaction.ngay)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-500">NhÃ  cung cáº¥p:</p>
                        <p className="font-semibold text-gray-800">
                            {selectedTransaction.loai === "NHAP" ? "CÃ´ng ty Sá»¯a Vinamilk" : "N/A"}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-500">NgÆ°á»i táº¡o phiáº¿u:</p>
                        <p className="font-semibold text-gray-800">{selectedTransaction.nguoiTao}</p>
                    </div>

                    <div className="col-span-2 pt-4 border-t border-gray-100">
                        <p className="text-gray-500 font-medium mb-2">Danh má»¥c sáº£n pháº©m:</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                Array.from(new Set(selectedTransaction.items.map(item => item.category))).map((cat) => (
                                    <span
                                        key={cat}
                                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200"
                                    >
                                        {cat}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400 text-xs">KhÃ´ng cÃ³ danh má»¥c</span>
                            )}
                        </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                        <p className="text-gray-500 font-medium">Sáº£n pháº©m & vá»‹ trÃ­ lÆ°u trá»¯:</p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                            {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                selectedTransaction.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                                        <div>
                                            <span className="font-semibold text-gray-800">{item.sku}</span>
                                            <span className="text-gray-500 ml-2">({item.name})</span>
                                        </div>
                                        <span className="text-pink-600 font-medium">{item.shelf}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 text-xs italic">KhÃ´ng cÃ³ sáº£n pháº©m chi tiáº¿t</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        ÄÃ³ng
                    </button>
                </div>
            </div>
        </div>
    );
}


