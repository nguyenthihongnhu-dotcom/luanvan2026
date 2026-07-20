import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "@/shared/hooks/useForm";
import { productService } from "@/features/products/services/productService";
import { getProductCategoryLabel, getProductNameLabel } from "@/features/products/utils/productDisplay";

export interface ProductItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    expiryDate: string;
    status: "In Stock" | "Low Stock" | "Out of Stock";
}

export const calculateStatus = (stock: number, minStock: number): ProductItem["status"] => {
    if (stock <= 0) return "Out of Stock";
    if (stock <= minStock) return "Low Stock";
    return "In Stock";
};

const initialFormState = {
    sku: '',
    name: '',
    category: '',
    stock: '',
    minStock: '',
    expiryDate: '',
};

const fallbackProducts: ProductItem[] = [
    { id: 1, sku: "BIM-HUG-M", name: "Tã quần Huggies Size M", category: "Bỉm tã", stock: 150, minStock: 10, expiryDate: "2026-12-31", status: "In Stock" },
    { id: 2, sku: "SUA-FRISO-3", name: "Sữa Frisolac Gold Số 3", category: "Sữa công thức", stock: 8, minStock: 20, expiryDate: "2026-11-30", status: "Low Stock" },
    { id: 3, sku: "TI-GIAM-CHICCO", name: "Ti giả Chicco silicone", category: "Đồ sơ sinh", stock: 0, minStock: 5, expiryDate: "2026-10-31", status: "Out of Stock" },
];

export function useProducts() {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);
    const [products, setProducts] = useState<ProductItem[]>(fallbackProducts);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await productService.listProducts();
                if (isMounted && result.length > 0) {
                    setProducts(result);
                }
            } catch (err) {
                console.error('Failed to load products from backend:', err);
                if (isMounted) {
                    setError('Không tải được sản phẩm từ backend, đang hiển thị dữ liệu mẫu.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const stockNum = parseInt(formData.stock) || 0;
        const minStockNum = parseInt(formData.minStock) || 0;
        const productData = {
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            stock: stockNum,
            minStock: minStockNum,
            expiryDate: formData.expiryDate,
            status: calculateStatus(stockNum, minStockNum),
        };

        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        } else {
            const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            setProducts([...products, { id: newId, ...productData }]);
        }

        setShowModal(false);
        setEditingProduct(null);
    };

    const handleEdit = (product: ProductItem) => {
        setEditingProduct(product);
        setFormData({
            sku: product.sku,
            name: getProductNameLabel(product.name),
            category: getProductCategoryLabel(product.category),
            stock: product.stock.toString(),
            minStock: product.minStock?.toString() || '',
            expiryDate: product.expiryDate || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
        setProducts(products.filter(p => p.id !== id));
    };

    return {
        products,
        setProducts,
        isLoading,
        error,
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
