import { useState, FormEvent } from "react";
import { useForm } from "./useForm";

// Định nghĩa kiểu dữ liệu của một đối tượng sản phẩm
export interface ProductItem {
    id: number;
    sku: string;           // Mã SKU của sản phẩm (vd: BIM-HUG-M)
    name: string;          // Tên sản phẩm
    category: string;      // Danh mục sản phẩm (Bỉm tã, Sữa công thức...)
    stock: number;         // Số lượng tồn kho thực tế
    minStock: number;      // Số lượng tồn kho tối thiểu để cảnh báo
    expiryDate: string;    // Hạn sử dụng của sản phẩm
    status: "In Stock" | "Low Stock" | "Out of Stock"; // Trạng thái tồn kho
}

/**
 * Tính toán tự động trạng thái tồn kho của sản phẩm dựa trên số lượng tồn thực tế
 * @param stock Số lượng tồn thực tế
 * @param minStock Ngưỡng tồn tối thiểu
 * @returns Trạng thái sản phẩm
 */
export const calculateStatus = (stock: number, minStock: number): ProductItem["status"] => {
    if (stock <= 0) return "Out of Stock";  // Hết hàng
    if (stock <= minStock) return "Low Stock"; // Sắp hết hàng
    return "In Stock"; // Còn hàng
};

// Trạng thái biểu mẫu trống ban đầu để thiết lập khi tạo mới
const initialFormState = {
    sku: '',
    name: '',
    category: '',
    stock: '',
    minStock: '',
    expiryDate: '',
};

/**
 * Custom Hook useProducts
 * Quản lý toàn bộ trạng thái danh mục sản phẩm, bộ lọc, đóng/mở modal và các thao tác CRUD.
 */
export function useProducts() {
    // Trạng thái hiển thị modal biểu mẫu (Thêm/Sửa)
    const [showModal, setShowModal] = useState(false);
    
    // Trạng thái sản phẩm đang được chỉnh sửa (null nếu đang ở chế độ thêm mới)
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

    // Sử dụng hook useForm dùng chung để đồng bộ dữ liệu biểu mẫu
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);

    // Danh sách sản phẩm khởi tạo ban đầu, tự động tính toán trạng thái status
    const [products, setProducts] = useState<ProductItem[]>(
        [
            { id: 1, sku: "BIM-HUG-M", name: "Tã quần Huggies Size M", category: "Bỉm tã", stock: 150, minStock: 10, expiryDate: "2023-12-31" },
            { id: 2, sku: "SUA-FRISO-3", name: "Sữa Frisolac Gold Số 3", category: "Sữa công thức", stock: 8, minStock: 20, expiryDate: "2023-11-30" },
            { id: 3, sku: "TI-GIAM-CHICCO", name: "Ti giả Chicco silicone", category: "Đồ sơ sinh", stock: 0, minStock: 5, expiryDate: "2023-10-31" },
        ].map(p => ({ ...p, status: calculateStatus(p.stock, p.minStock) }))
    );

    /**
     * Xử lý sự kiện Submit Form (Lưu sản phẩm mới hoặc Lưu chỉnh sửa)
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Chuyển đổi chuỗi đầu vào từ form sang dạng số nguyên
        const stockNum = parseInt(formData.stock) || 0;
        const minStockNum = parseInt(formData.minStock) || 0;

        // Chuẩn bị đối tượng dữ liệu sản phẩm mới
        const productData = {
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            stock: stockNum,
            minStock: minStockNum,
            expiryDate: formData.expiryDate,
            status: calculateStatus(stockNum, minStockNum), // Tính toán lại trạng thái hàng
        };

        if (editingProduct) {
            // Chế độ chỉnh sửa: Duyệt mảng và thay thế phần tử đang sửa bằng dữ liệu mới
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        } else {
            // Chế độ thêm mới: Tìm ID lớn nhất hiện tại để sinh ID tiếp theo
            const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            setProducts([...products, { id: newId, ...productData }]);
        }

        // Đóng modal và reset trạng thái chỉnh sửa
        setShowModal(false);
        setEditingProduct(null);
    };

    /**
     * Kích hoạt chế độ chỉnh sửa sản phẩm
     * @param product Đối tượng sản phẩm được chọn để sửa
     */
    const handleEdit = (product: ProductItem) => {
        setEditingProduct(product);
        // Đổ dữ liệu sản phẩm đang chọn vào biểu mẫu form
        setFormData({
            sku: product.sku,
            name: product.name,
            category: product.category,
            stock: product.stock.toString(),
            minStock: product.minStock?.toString() || '',
            expiryDate: product.expiryDate || '',
        });
        // Mở modal biểu mẫu lên
        setShowModal(true);
    };

    /**
     * Xóa sản phẩm ra khỏi danh mục
     * @param id ID của sản phẩm cần xóa
     */
    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
        try {
            // Lọc bỏ phần tử có ID bị xóa khỏi mảng
            setProducts(products.filter(p => p.id !== id));
        } catch (err: any) {
            console.error("Lỗi khi xóa sản phẩm:", err);
        }
    };

    return {
        products,
        setProducts,
        showModal,
        setShowModal,
        editingProduct,
        setEditingProduct,
        formData,
        setFormData,
        handleInputChange,
        resetForm,
        handleSubmit,
        handleEdit,
        handleDelete,
    };
}
