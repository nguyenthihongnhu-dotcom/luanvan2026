import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "@/shared/hooks/useForm";
import { transactionService } from "@/features/transactions/services/transactionService";

export interface TransactionItem {
    sku: string;
    name: string;
    category: string;
    shelf: string;
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

export function useTransactions() {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [typeFilter, setTypeFilter] = useState("All");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([{ sku: "", name: "", category: "", shelf: "" }]);
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
                const result = await transactionService.listTransactions();
                if (isMounted) setData(result);
            } catch (err) {
                console.error("Failed to load transactions from backend:", err);
                if (isMounted) setError("Không tải được giao dịch từ backend.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        void loadTransactions();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const transactionData: Transaction = {
            id: editingTransaction?.id ?? 0,
            ...formData,
            items: formData.loai === "NHAP" ? items : undefined
        };

        if (!editingTransaction) {
            await transactionService.createTransaction(transactionData);
            await reloadTransactions();
        } else {
            setData(data.map((transaction) => transaction.id === editingTransaction.id ? { ...transaction, ...transactionData } : transaction));
        }

        setShowModal(false);
        setEditingTransaction(null);
        resetForm();
        setItems([{ sku: "", name: "", category: "", shelf: "" }]);
    };

    const handleAddClick = () => {
        setEditingTransaction(null);
        resetForm();
        setItems([{ sku: "", name: "", category: "", shelf: "" }]);
        setShowModal(true);
    };

    const handleDetailClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    const handleAddItemRow = () => setItems([...items, { sku: "", name: "", category: "", shelf: "" }]);
    const handleRemoveItemRow = (index: number) => setItems(items.length === 1 ? [{ sku: "", name: "", category: "", shelf: "" }] : items.filter((_, itemIndex) => itemIndex !== index));
    const handleItemChange = (index: number, field: keyof TransactionItem, value: string) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));

    return { data, isLoading, error, setData, showModal, setShowModal, editingTransaction, setEditingTransaction, typeFilter, setTypeFilter, showDetailModal, setShowDetailModal, selectedTransaction, setSelectedTransaction, formData, setFormData, handleInputChange, resetForm, handleSubmit, handleAddClick, handleDetailClick, items, setItems, handleAddItemRow, handleRemoveItemRow, handleItemChange };
}