import { useEffect } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useDateFormatter } from "@/shared/hooks";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import type { Transaction } from "@/features/transactions/hooks/useTransactions";
import TransactionModal from "@/features/transactions/components/TransactionModal";
import TransactionDetailModal from "@/features/transactions/components/TransactionDetailModal";

export default function Transactions() {
    const { setExtraContent } = useSidebar();
    const { formatDate } = useDateFormatter();
    const {
        data,
        showModal,
        setShowModal,
        editingTransaction,
        typeFilter,
        setTypeFilter,
        showDetailModal,
        setShowDetailModal,
        selectedTransaction,
        formData,
        handleInputChange,
        handleSubmit,
        handleAddClick,
        handleDetailClick,
        items,
        handleAddItemRow,
        handleRemoveItemRow,
        handleItemChange,
    } = useTransactions();

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase">LoÃƒÂ¡Ã‚ÂºÃ‚Â¡i giao dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch</label>
                <div className="space-y-2">
                    {["All", "NHAP", "XUAT", "DIEU_CHINH"].map(t => (
                        <label key={t} className="flex items-center space-x-2 text-sm text-gray-600">
                            <input
                                type="radio"
                                name="transType"
                                checked={typeFilter === t}
                                onChange={() => setTypeFilter(t)}
                                className="text-pink-600 focus:ring-pink-500"
                            />
                            <span>{t === "All" ? "TÃƒÂ¡Ã‚ÂºÃ‚Â¥t cÃƒÂ¡Ã‚ÂºÃ‚Â£" : t}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, setTypeFilter, typeFilter]);

    const columns: ColumnProps<Transaction>[] = [
        { key: "soPhieu", title: "SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ phiÃƒÂ¡Ã‚ÂºÃ‚Â¿u" },
        {
            key: "loai",
            title: "LoÃƒÂ¡Ã‚ÂºÃ‚Â¡i giao dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch",
            render: (val) => {
                const transactionType = val as Transaction["loai"];
                const colors = {
                    NHAP: "bg-blue-50 text-blue-700 border-blue-200",
                    XUAT: "bg-purple-50 text-purple-700 border-purple-200",
                    DIEU_CHINH: "bg-orange-50 text-orange-700 border-orange-200"
                };
                return (
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${colors[transactionType]}`}>
                        {transactionType}
                    </span>
                );
            }
        },
        { key: "ngay", title: "NgÃƒÆ’ y thÃƒÂ¡Ã‚Â»Ã‚Â±c hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n", render: (value) => formatDate(value as string) },
        { key: "status", title: "TrÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i" },
        { key: "nguoiTao", title: "NgÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚i tÃƒÂ¡Ã‚ÂºÃ‚Â¡o" },
        {
            key: "actions",
            title: "Thao tÃƒÆ’Ã‚Â¡c",
            render: (_, record: Transaction) => (
                <button
                    onClick={() => handleDetailClick(record)}
                    className="text-pink-600 hover:text-pink-800 font-medium"
                >
                    Chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t
                </button>
            )
        }
    ];

    const filteredData = data.filter(item => typeFilter === "All" || item.loai === typeFilter);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">LÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ Giao dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch Kho</h1>
                    <div className="flex space-x-2">
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">XuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÆ’Ã‚Â¡o cÃƒÆ’Ã‚Â¡o</button>
                        <button
                            onClick={handleAddClick}
                            className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">
                            + ThÃƒÆ’Ã‚Âªm giao dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="text"
                        placeholder="TÃƒÆ’Ã‚Â¬m kiÃƒÂ¡Ã‚ÂºÃ‚Â¿m mÃƒÆ’Ã‚Â£ phiÃƒÂ¡Ã‚ÂºÃ‚Â¿u, khÃƒÆ’Ã‚Â¡ch hÃƒÆ’ ng..."
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                    />
                </div>

                <Tablelayout
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                />
            </div>

            {showModal && createPortal(
                <TransactionModal
                    editingTransaction={editingTransaction}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                    items={items}
                    handleAddItemRow={handleAddItemRow}
                    handleRemoveItemRow={handleRemoveItemRow}
                    handleItemChange={handleItemChange}
                />,
                document.body
            )}

            {showDetailModal && selectedTransaction && createPortal(
                <TransactionDetailModal
                    selectedTransaction={selectedTransaction}
                    onClose={() => setShowDetailModal(false)}
                />,
                document.body
            )}
        </DashboardLayout>
    );
}






