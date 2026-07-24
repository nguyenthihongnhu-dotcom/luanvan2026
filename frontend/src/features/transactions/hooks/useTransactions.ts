import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "@/shared/hooks/useForm";
import { transactionService } from "@/features/transactions/services/transactionService";
import type { AllocationPreviewResult, AllocationStrategy } from "@/features/transactions/services/transactionService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

export interface TransactionItem {
    productVariantId: string;
    batchId: string;
    locationId: string;
    quantity: string;
    adjustmentDirection: "IN" | "OUT";
    note: string;
}

export interface Transaction {
    id: number;
    soPhieu: string;
    loai: "NHAP" | "XUAT" | "DIEU_CHINH";
    ngay: string;
    status: string;
    nguoiTao: string;
    maNCC?: string;
    maDonHangThamChieu?: string;
    maTonKho?: string;
    soLuongCu?: string;
    soLuongMoi?: string;
    lyDo?: string;
    nguoiPheDuyet?: string;
    items?: TransactionItem[];
}

const emptyItem: TransactionItem = {
    productVariantId: "",
    batchId: "",
    locationId: "",
    quantity: "",
    adjustmentDirection: "IN",
    note: "",
};

const initialFormState = {
    soPhieu: "",
    loai: "NHAP" as "NHAP" | "XUAT" | "DIEU_CHINH",
    ngay: "",
    status: "MOI_TAO",
    nguoiTao: "",
    maNCC: "",
    maDonHangThamChieu: "",
    maTonKho: "",
    soLuongCu: "",
    soLuongMoi: "",
    lyDo: "",
    nguoiPheDuyet: ""
};

function makeEmptyItem(): TransactionItem {
    return { ...emptyItem };
}

export function useTransactions() {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [typeFilter, setTypeFilter] = useState("All");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([makeEmptyItem()]);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [allocationStrategy, setAllocationStrategy] = useState<AllocationStrategy>("FEFO");
    const [allocationPreview, setAllocationPreview] = useState<AllocationPreviewResult | null>(null);
    const [previewingItemIndex, setPreviewingItemIndex] = useState<number | null>(null);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);
    const [data, setData] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reloadTransactions = async () => {
        const result = await transactionService.listTransactions();
        setData(result);
    };

    useEffect(() => {
        let isMounted = true;

        async function loadTransactions() {
            setIsLoading(true);
            setError(null);
            try {
                const [result, warehouseRows] = await Promise.all([
                    transactionService.listTransactions(),
                    transactionService.listWarehouses(),
                ]);

                if (isMounted) {
                    setData(result);
                    setWarehouses(warehouseRows);
                    setSelectedWarehouseId((current) => current || (warehouseRows[0] ? String(warehouseRows[0].id) : ""));
                }
            } catch (err) {
                console.error("Failed to load transactions from backend:", err);
                if (isMounted) setError(getHttpErrorMessage(err, "Không tải được giao dịch từ backend"));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        void loadTransactions();
        return () => { isMounted = false; };
    }, []);

    const resetTransactionForm = () => {
        resetForm();
        setItems([makeEmptyItem()]);
        setAllocationStrategy("FEFO");
        setAllocationPreview(null);
        setPreviewingItemIndex(null);
    };


    function validateTransactionForm(): string | null {
        if (!formData.soPhieu.trim()) return 'Nhập số phiếu trước khi lưu.';
        if (!selectedWarehouseId) return 'Chọn kho trước khi lưu chứng từ.';
        if (items.length === 0) return 'Chứng từ cần ít nhất một dòng hàng.';

        for (const [index, item] of items.entries()) {
            const rowNumber = index + 1;
            const productVariantId = Number(item.productVariantId);
            const quantity = Number(item.quantity);
            const locationId = Number(item.locationId);

            if (!Number.isInteger(productVariantId) || productVariantId <= 0) return `Dòng ${rowNumber}: Variant ID không hợp lệ.`;
            if (!Number.isFinite(quantity) || quantity <= 0) return `Dòng ${rowNumber}: Số lượng phải lớn hơn 0.`;
            if (!Number.isInteger(locationId) || locationId <= 0) return `Dòng ${rowNumber}: Vị trí kho không hợp lệ.`;
            if (formData.loai === 'DIEU_CHINH' && item.adjustmentDirection !== 'IN' && item.adjustmentDirection !== 'OUT') return `Dòng ${rowNumber}: Hướng điều chỉnh không hợp lệ.`;
        }

        return null;
    }    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const validationError = validateTransactionForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const transactionData: Transaction = {
            id: editingTransaction?.id ?? 0,
            ...formData,
            maTonKho: selectedWarehouseId,
            items
        };

        if (!editingTransaction) {
            await transactionService.createTransaction(transactionData);
            await reloadTransactions();
        } else {
            setData(data.map((transaction) => transaction.id === editingTransaction.id ? { ...transaction, ...transactionData } : transaction));
        }

        setShowModal(false);
        setEditingTransaction(null);
        resetTransactionForm();
    };

    const handleAddClick = () => {
        setEditingTransaction(null);
        resetTransactionForm();
        setShowModal(true);
    };

    const handleDetailClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    const runTransactionAction = async (action: () => Promise<void>, errorMessage: string) => {
        setError(null);
        try {
            await action();
            await reloadTransactions();
        } catch (err) {
            console.error(errorMessage, err);
            setError(getHttpErrorMessage(err, errorMessage));
        }
    };

    const handleConfirmTransaction = async (transaction: Transaction) => {
        if (!window.confirm("Xác nhận chứng từ và cập nhật tồn kho?")) return;
        await runTransactionAction(() => transactionService.confirmTransaction(transaction), "Không xác nhận được chứng từ. Kiểm tra chứng từ đã có dòng hàng và quyền thao tác.");
    };

    const handleReverseTransaction = async (transaction: Transaction) => {
        if (!window.confirm("Đảo chứng từ này?")) return;
        await runTransactionAction(() => transactionService.reverseTransaction(transaction), "Không đảo được chứng từ. Kiểm tra trạng thái và tồn kho liên quan.");
    };

    const handleApproveAdjustment = async (transaction: Transaction) => {
        if (!window.confirm("Duyệt phiếu điều chỉnh tồn kho?")) return;
        await runTransactionAction(() => transactionService.approveAdjustment(transaction.id), "Không duyệt được phiếu điều chỉnh.");
    };

    const handleRejectAdjustment = async (transaction: Transaction) => {
        const reason = window.prompt("Nhập lý do từ chối phiếu điều chỉnh:");
        if (!reason) return;
        await runTransactionAction(() => transactionService.rejectAdjustment(transaction.id, reason), "Không từ chối được phiếu điều chỉnh.");
    };

    const handleCancelAdjustment = async (transaction: Transaction) => {
        if (!window.confirm("Hủy phiếu điều chỉnh này?")) return;
        await runTransactionAction(() => transactionService.cancelAdjustment(transaction.id), "Không hủy được phiếu điều chỉnh.");
    };

    const handleAddItemRow = () => setItems([...items, makeEmptyItem()]);

    const handleRemoveItemRow = (index: number) => {
        setItems(items.length === 1 ? [makeEmptyItem()] : items.filter((_, itemIndex) => itemIndex !== index));
        setAllocationPreview(null);
    };

    const handleItemChange = (index: number, field: keyof TransactionItem, value: string) => {
        setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
        if (["productVariantId", "quantity", "locationId", "batchId"].includes(field)) {
            setAllocationPreview(null);
        }
    };

    const handlePreviewAllocation = async (index: number) => {
        const item = items[index];
        const warehouseId = Number(selectedWarehouseId);
        const productVariantId = Number(item.productVariantId);
        const quantity = Number(item.quantity);

        if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
            setError("Chọn kho trước khi xem phân bổ.");
            return;
        }

        if (!Number.isFinite(productVariantId) || productVariantId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
            setError("Nhập Variant ID và số lượng hợp lệ trước khi xem phân bổ.");
            return;
        }

        setError(null);
        setPreviewingItemIndex(index);
        try {
            const result = await transactionService.previewAllocation({
                warehouseId,
                productVariantId,
                quantity,
                strategy: allocationStrategy,
            });
            setAllocationPreview(result);

            const firstAllocation = result.items[0];
            if (firstAllocation) {
                setItems((currentItems) => currentItems.map((currentItem, itemIndex) => itemIndex === index ? {
                    ...currentItem,
                    locationId: String(firstAllocation.locationId),
                    batchId: firstAllocation.batchId ? String(firstAllocation.batchId) : currentItem.batchId,
                } : currentItem));
            }
        } catch (err) {
            console.error("Failed to preview stock allocation:", err);
            setError(getHttpErrorMessage(err, "Không xem được phân bổ tồn kho. Kiểm tra Variant ID, tồn kho và kết nối backend."));
            setAllocationPreview(null);
        } finally {
            setPreviewingItemIndex(null);
        }
    };

    return {
        data,
        isLoading,
        error,
        setData,
        showModal,
        setShowModal,
        editingTransaction,
        setEditingTransaction,
        typeFilter,
        setTypeFilter,
        showDetailModal,
        setShowDetailModal,
        selectedTransaction,
        setSelectedTransaction,
        formData,
        setFormData,
        handleInputChange,
        resetForm,
        handleSubmit,
        handleAddClick,
        handleDetailClick,
        handleConfirmTransaction,
        handleReverseTransaction,
        handleApproveAdjustment,
        handleRejectAdjustment,
        handleCancelAdjustment,
        items,
        setItems,
        handleAddItemRow,
        handleRemoveItemRow,
        handleItemChange,
        warehouses,
        selectedWarehouseId,
        setSelectedWarehouseId,
        allocationStrategy,
        setAllocationStrategy,
        allocationPreview,
        previewingItemIndex,
        handlePreviewAllocation,
    };
}