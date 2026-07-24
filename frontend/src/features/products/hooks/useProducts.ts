import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "@/shared/hooks/useForm";
import { productService } from "@/features/products/services/productService";
import { getProductCategoryLabel, getProductNameLabel } from "@/features/products/utils/productDisplay";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

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

const fallbackProducts: ProductItem[] = [];

export function useProducts() {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);
    const [products, setProducts] = useState<ProductItem[]>(fallbackProducts);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reloadProducts = async () => {
        const result = await productService.listProducts();
        setProducts(result);
    };

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await productService.listProducts();
                if (isMounted) setProducts(result);
            } catch (err) {
                console.error('Failed to load products from backend:', err);
                if (isMounted) setError(getHttpErrorMessage(err, 'Không tải được sản phẩm từ backend'));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        void loadProducts();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const stockNum = parseInt(formData.stock) || 0;
        const minStockNum = parseInt(formData.minStock) || 0;
        const productData: ProductItem = {
            id: editingProduct?.id ?? 0,
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            stock: stockNum,
            minStock: minStockNum,
            expiryDate: formData.expiryDate,
            status: calculateStatus(stockNum, minStockNum),
        };

        if (editingProduct) {
            await productService.updateProduct(editingProduct.id, productData);
        } else {
            await productService.createProduct(productData);
        }

        await reloadProducts();
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
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
        await productService.deleteProduct(id);
        await reloadProducts();
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