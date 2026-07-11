import { useEffect } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../../../layout/Dashboardlayout";
import Tablelayout from "../../../components/Table/Tablelayout";
import { useSidebar } from "../../../context/Sidebarcontext";
import type { ColumnProps } from "../../../components/Table/types";
import { useTransactions } from "../../../hooks/useTransactions";
import type { Transaction } from "../../../hooks/useTransactions";
import TransactionModal from "./components/TransactionModal";
import TransactionDetailModal from "./components/TransactionDetailModal";

export default function Transactions() {
    const { setExtraContent } = useSidebar();
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
                    {["All", "NHAP", "XUAT", "DIEU_CHINH"].map(t => (
                        <label key={t} className="flex items-center space-x-2 text-sm text-gray-600">
                            <input
                                type="radio"
                                name="transType"
                                checked={typeFilter === t}
                                onChange={() => setTypeFilter(t)}
                                className="text-pink-600 focus:ring-pink-500"
                            />
                            <span>{t === "All" ? "Tất cả" : t}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, typeFilter]);

    const columns: ColumnProps<Transaction>[] = [
        { key: "soPhieu", title: "Số phiếu" },
        {
            key: "loai",
            title: "Loại giao dịch",
            render: (val) => {
                const colors = {
                    NHAP: "bg-blue-50 text-blue-700 border-blue-200",
                    XUAT: "bg-purple-50 text-purple-700 border-purple-200",
                    DIEU_CHINH: "bg-orange-50 text-orange-700 border-orange-200"
                };
                return (
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${colors[val as keyof typeof colors]}`}>
                        {val}
                    </span>
                );
            }
        },
        { key: "ngay", title: "Ngày thực hiện" },
        { key: "status", title: "Trạng thái" },
        { key: "nguoiTao", title: "Người tạo" },
        {
            key: "actions",
            title: "Thao tác",
            render: (_, record: Transaction) => (
                <button
                    onClick={() => handleDetailClick(record)}
                    className="text-pink-600 hover:text-pink-800 font-medium"
                >
                    Chi tiết
                </button>
            )
        }
    ];

    const filteredData = data.filter(item => typeFilter === "All" || item.loai === typeFilter);

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Lịch sử Giao dịch Kho</h1>
                    <div className="flex space-x-2">
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">Xuất báo cáo</button>
                        <button
                            onClick={handleAddClick}
                            className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 shadow-sm">
                            + Thêm giao dịch
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="text"
                        placeholder="Tìm kiếm mã phiếu, khách hàng..."
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
