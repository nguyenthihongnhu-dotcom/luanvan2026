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

const transactionTypeOptions: Array<Transaction["loai"]> = ["NHAP", "XUAT", "DIEU_CHINH"];

function getTransactionTypeLabel(type: Transaction["loai"]): string {
    switch (type) {
        case "NHAP":
            return "Nhập kho";
        case "XUAT":
            return "Xuất kho";
        case "DIEU_CHINH":
            return "Điều chỉnh";
        default:
            return "Không xác định";
    }
}

function getTransactionStatusLabel(status: string): string {
    const normalized = status.trim().toUpperCase();
    const labels: Record<string, string> = {
        DRAFT: "Nháp",
        MOI_TAO: "Mới tạo",
        PENDING: "Chờ xử lý",
        PENDING_APPROVAL: "Chờ duyệt",
        CONFIRMED: "Đã xác nhận",
        APPROVED: "Đã duyệt",
        REJECTED: "Đã từ chối",
        CANCELLED: "Đã hủy",
        REVERSED: "Đã đảo phiếu",
        COMPLETED: "Hoàn tất"
    };
    return labels[normalized] ?? status;
}
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
                <label className="block text-xs font-semibold text-gray-500 uppercase">Loại giao dịch</label>
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input type="radio" name="transType" checked={typeFilter === "All"} onChange={() => setTypeFilter("All")} className="text-pink-600 focus:ring-pink-500" />
                        <span>Tất cả</span>
                    </label>
                    {transactionTypeOptions.map((type) => (
                        <label key={type} className="flex items-center space-x-2 text-sm text-gray-600">
                            <input type="radio" name="transType" checked={typeFilter === type} onChange={() => setTypeFilter(type)} className="text-pink-600 focus:ring-pink-500" />
                            <span>{getTransactionTypeLabel(type)}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, setTypeFilter, typeFilter]);

    const columns: ColumnProps<Transaction>[] = [
        { key: "soPhieu", title: "Số phiếu" },
        {
            key: "loai",
            title: "Loại giao dịch",
            render: (val) => {
                const transactionType = val as Transaction["loai"];
                const colors = {
                    NHAP: "bg-blue-50 text-blue-700 border-blue-200",
                    XUAT: "bg-purple-50 text-purple-700 border-purple-200",
                    DIEU_CHINH: "bg-orange-50 text-orange-700 border-orange-200"
                };
                return (
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${colors[transactionType]}`}>
                        {getTransactionTypeLabel(transactionType)}
                    </span>
                );
            }
        },
        { key: "ngay", title: "Ngày thực hiện", render: (value) => formatDate(value as string) },
        { key: "status", title: "Trạng thái", render: (value) => getTransactionStatusLabel(String(value ?? "")) },
        { key: "nguoiTao", title: "Người tạo" },
        {
            key: "actions",
            title: "Thao tác",
            render: (_, record: Transaction) => <button onClick={() => handleDetailClick(record)} className="text-pink-600 hover:text-pink-800 font-medium">Chi tiết</button>
        }
    ];

    const filteredData = data.filter(item => typeFilter === "All" || item.loai === typeFilter);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Lịch sử giao dịch kho</h1>
                    <div className="flex space-x-2">
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">Xuất báo cáo</button>
                        <button onClick={handleAddClick} className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">+ Thêm giao dịch</button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input type="text" placeholder="Tìm kiếm mã phiếu, khách hàng..." className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" />
                </div>

                <Tablelayout columns={columns} dataSource={filteredData} rowKey="id" />
            </div>

            {showModal && createPortal(
                <TransactionModal editingTransaction={editingTransaction} formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} onClose={() => setShowModal(false)} items={items} handleAddItemRow={handleAddItemRow} handleRemoveItemRow={handleRemoveItemRow} handleItemChange={handleItemChange} />,
                document.body
            )}

            {showDetailModal && selectedTransaction && createPortal(
                <TransactionDetailModal selectedTransaction={selectedTransaction} onClose={() => setShowDetailModal(false)} />,
                document.body
            )}
        </DashboardLayout>
    );
}
