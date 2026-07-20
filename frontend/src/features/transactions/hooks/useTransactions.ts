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

const fallbackTransactions: Transaction[] = [
    {
        id: 1,
        soPhieu: "PN-2023-001",
        loai: "NHAP",
        ngay: "2023-10-25",
        status: "Da nhap hang",
        nguoiTao: "Admin",
        maNCC: "NCC-001",
        items: [
            { sku: "SUA-FRISO-3", name: "Sữa Frisolac Gold Số 3", category: "Sữa công thức", shelf: "Kệ 01 - Tầng 03 (A-01-03)" },
            { sku: "BIM-HUG-M", name: "Tã quần Huggies Size M", category: "Bỉm tã", shelf: "Kệ 01 - Tầng 01 (A-01-01)" }
        ]
    },
    { id: 2, soPhieu: "PX-2023-042", loai: "XUAT", ngay: "2023-10-26", status: "Đăng xuất kho", nguoiTao: "NhânViênA" },
    { id: 3, soPhieu: "DC-2023-005", loai: "DIEU_CHINH", ngay: "2023-10-27", status: "Chờ duyệt", nguoiTao: "QuảnLýKho" },
];

export function useTransactions() {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [typeFilter, setTypeFilter] = useState("All");
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [items, setItems] = useState<TransactionItem[]>([
        { sku: "", name: "", category: "", shelf: "" }
    ]);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);
    const [data, setData] = useState<Transaction[]>(fallbackTransactions);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadTransactions() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await transactionService.listTransactions();
                if (isMounted && result.length > 0) {
                    setData(result);
                }
            } catch (err) {
                console.error("Failed to load transactions from backend:", err);
                if (isMounted) {
                    setError("Không tải được giao dịch từ backend, đang hiển thị dữ liệu mẫu.");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadTransactions();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const transactionData = {
            ...formData,
            items: formData.loai === "NHAP" ? items : undefined
        };

        if (editingTransaction) {
            setData(data.map(t => t.id === editingTransaction.id ? { ...t, ...transactionData } : t));
        } else {
            const newId = data.length > 0 ? Math.max(...data.map(t => t.id)) + 1 : 1;
            setData([...data, { id: newId, ...transactionData }]);
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

    const handleAddItemRow = () => {
        setItems([...items, { sku: "", name: "", category: "", shelf: "" }]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (items.length === 1) {
            setItems([{ sku: "", name: "", category: "", shelf: "" }]);
        } else {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index: number, field: keyof TransactionItem, value: string) => {
        setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
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
        items,
        setItems,
        handleAddItemRow,
        handleRemoveItemRow,
        handleItemChange,
    };
}
