import { useState, FormEvent } from "react";
import { useForm } from "./useForm";

// Định nghĩa kiểu dữ liệu cho từng dòng sản phẩm chi tiết trong phiếu giao dịch
export interface TransactionItem {
    sku: string;           // Mã sản phẩm (SKU)
    name: string;          // Tên sản phẩm
    category: string;      // Phân loại hàng
    shelf: string;         // Tên kệ hàng được lưu trữ (vd: Kệ 01...)
}

// Định nghĩa kiểu dữ liệu cho một chứng từ giao dịch kho (Nhập/Xuất/Điều chỉnh)
export interface Transaction {
    id: number;
    soPhieu: string;                           // Số phiếu giao dịch (vd: PN-2023-001)
    loai: "NHAP" | "XUAT" | "DIEU_CHINH";      // Loại phiếu
    ngay: string;                              // Ngày thực hiện giao dịch
    status: string;                            // Trạng thái phiếu
    nguoiTao: string;                          // Nhân viên tạo phiếu
    maNCC?: string;                            // Mã nhà cung cấp (chỉ áp dụng cho Phiếu Nhập)
    maDonHangThamChieu?: string;               // Mã đơn hàng tham chiếu (chỉ áp dụng cho Phiếu Xuất)
    maTonKho?: string;                         // Mã tồn kho cần điều chỉnh (chỉ áp dụng cho Phiếu Điều Chỉnh)
    soLuongCu?: string;                        // Số lượng cũ trước điều chỉnh (chỉ áp dụng cho Phiếu Điều Chỉnh)
    soLuongMoi?: string;                       // Số lượng mới sau điều chỉnh (chỉ áp dụng cho Phiếu Điều Chỉnh)
    lyDo?: string;                             // Lý do điều chỉnh (chỉ áp dụng cho Phiếu Điều Chỉnh)
    nguoiPheDuyet?: string;                    // Quản lý phê duyệt (chỉ áp dụng cho Phiếu Điều Chỉnh)
    items?: TransactionItem[];                 // Mảng chi tiết danh sách sản phẩm nhập (nếu có)
}

// Trạng thái form trống ban đầu cho giao dịch
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

/**
 * Custom Hook useTransactions
 * Quản lý trạng thái danh sách giao dịch, bộ lọc phân loại,
 * trạng thái các modal thêm/sửa/xem chi tiết và quản lý động các dòng sản phẩm của phiếu nhập.
 */
export function useTransactions() {
    // Trạng thái hiển thị modal thêm mới giao dịch
    const [showModal, setShowModal] = useState(false);
    
    // Trạng thái giao dịch đang được chỉnh sửa (nếu có)
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    
    // Trạng thái phân loại bộ lọc trên Sidebar (Tất cả, Nhập, Xuất, Điều chỉnh)
    const [typeFilter, setTypeFilter] = useState("All");
    
    // Trạng thái hiển thị modal xem chi tiết giao dịch
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Trạng thái lưu trữ giao dịch đang được chọn để hiển thị chi tiết
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Trạng thái quản lý danh sách dòng sản phẩm động (chỉ áp dụng khi tạo Phiếu Nhập)
    const [items, setItems] = useState<TransactionItem[]>([
        { sku: "", name: "", category: "", shelf: "" }
    ]);

    // Sử dụng hook useForm dùng chung để đồng bộ dữ liệu biểu mẫu giao dịch
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);

    // Danh sách lịch sử giao dịch ban đầu
    const [data, setData] = useState<Transaction[]>([
        { 
            id: 1, 
            soPhieu: "PN-2023-001", 
            loai: "NHAP", 
            ngay: "2023-10-25", 
            status: "Đã nhập hàng", 
            nguoiTao: "Admin",
            maNCC: "NCC-001",
            items: [
                { sku: "SUA-FRISO-3", name: "Sữa Frisolac Gold Số 3", category: "Sữa công thức", shelf: "Kệ 01 - Tầng 03 (A-01-03)" },
                { sku: "BIM-HUG-M", name: "Tã quần Huggies Size M", category: "Bỉm tã", shelf: "Kệ 01 - Tầng 01 (A-01-01)" }
            ]
        },
        { id: 2, soPhieu: "PX-2023-042", loai: "XUAT", ngay: "2023-10-26", status: "Đang xuất kho", nguoiTao: "NhanVienA" },
        { id: 3, soPhieu: "DC-2023-005", loai: "DIEU_CHINH", ngay: "2023-10-27", status: "Chờ duyệt", nguoiTao: "QuanLyKho" },
    ]);

    /**
     * Xử lý sự kiện lưu biểu mẫu giao dịch (Submit Form)
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Chuẩn bị dữ liệu giao dịch. Nếu là Phiếu Nhập, gán thêm mảng sản phẩm items
        const transactionData = {
            ...formData,
            items: formData.loai === "NHAP" ? items : undefined
        };
        
        if (editingTransaction) {
            // Cập nhật giao dịch cũ trong mảng
            setData(data.map(t => t.id === editingTransaction.id ? { ...t, ...transactionData } : t));
        } else {
            // Sinh ID lớn nhất + 1 để lưu giao dịch mới
            const newId = data.length > 0 ? Math.max(...data.map(t => t.id)) + 1 : 1;
            setData([...data, { id: newId, ...transactionData }]);
        }
        
        // Đóng modal, reset dữ liệu biểu mẫu và danh sách dòng sản phẩm động về mặc định
        setShowModal(false);
        setEditingTransaction(null);
        resetForm();
        setItems([{ sku: "", name: "", category: "", shelf: "" }]);
    };

    /**
     * Kích hoạt khi nhấp nút thêm giao dịch mới
     */
    const handleAddClick = () => {
        setEditingTransaction(null);
        resetForm();
        setItems([{ sku: "", name: "", category: "", shelf: "" }]); // Khởi tạo 1 dòng trống
        setShowModal(true);
    };

    /**
     * Kích hoạt khi nhấp xem chi tiết phiếu
     */
    const handleDetailClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    /**
     * Thêm một dòng sản phẩm trống mới vào biểu mẫu nhập sản phẩm của Phiếu Nhập
     */
    const handleAddItemRow = () => {
        setItems([...items, { sku: "", name: "", category: "", shelf: "" }]);
    };

    /**
     * Xóa một dòng sản phẩm dựa vào số thứ tự dòng (index)
     */
    const handleRemoveItemRow = (index: number) => {
        if (items.length === 1) {
            // Nếu chỉ còn 1 dòng duy nhất, thay vì xóa thì ta làm trống dòng đó
            setItems([{ sku: "", name: "", category: "", shelf: "" }]);
        } else {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    /**
     * Cập nhật thông tin nhập liệu cho một trường dữ liệu cụ thể trong danh sách dòng sản phẩm động
     * @param index Số thứ tự dòng sản phẩm đang chỉnh sửa
     * @param field Tên thuộc tính cần thay đổi (sku, name, category, shelf)
     * @param value Giá trị mới điền vào
     */
    const handleItemChange = (index: number, field: keyof TransactionItem, value: string) => {
        setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    return {
        data,
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
