import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useForm } from "@/shared/hooks/useForm";
import { productService } from "@/features/products/services/productService";
import type { LocationOption } from "@/features/products/services/productService";
import { categoryService, type Category } from "@/features/products/services/categoryService";
import { getProductCategoryLabel, getProductNameLabel, productCategoryOptions } from "@/features/products/utils/productDisplay";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

export type ProductStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface ProductItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    expiryDate: string;
    warehouseId: string;
    locationId: string;
    locations: string;
    status: ProductStockStatus;
    /** SKU bắt buộc khai số lô khi nhập/xuất. */
    requiresLotTracking: boolean;
    /** SKU bắt buộc có hạn sử dụng, cần cho việc xuất theo FEFO. */
    requiresExpiryTracking: boolean;
}

export const calculateStatus = (stock: number, minStock: number): ProductItem["status"] => {
    if (stock <= 0) return "OUT_OF_STOCK";
    if (stock <= minStock) return "LOW_STOCK";
    return "IN_STOCK";
};

// Danh mục chỉ khai báo sản phẩm: tồn, vị trí và hạn dùng thuộc về phiếu nhập
// kho và lô hàng nên không nằm trong form này.
const initialFormState = {
    sku: "",
    name: "",
    category: "",
    minStock: "",
};

const fallbackProducts: ProductItem[] = [];

export function useProducts() {
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);
    const [products, setProducts] = useState<ProductItem[]>(fallbackProducts);
    const [categories, setCategories] = useState<Category[]>([]);
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reloadProducts = async () => {
        const [result, categoryList] = await Promise.all([
            productService.listProducts(),
            categoryService.listCategories().catch(() => []),
        ]);
        setProducts(result);
        setCategories(categoryList);
    };

    useEffect(() => {
        let isMounted = true;

        async function loadProducts() {
            setIsLoading(true);
            setError(null);

            try {
                const [result, locations, categoryList] = await Promise.all([
                    productService.listProducts(),
                    productService.listLocationOptions(),
                    categoryService.listCategories().catch((err) => {
                        console.error("Failed to load categories:", err);
                        return [];
                    }),
                ]);
                if (isMounted) {
                    setProducts(result);
                    setLocationOptions(locations);
                    setCategories(categoryList);
                }
            } catch (err) {
                console.error("Failed to load products from backend:", err);
                if (isMounted) setError(getHttpErrorMessage(err, "Không tải được sản phẩm từ backend"));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        void loadProducts();
        return () => { isMounted = false; };
    }, []);

    const categoryOptions = useMemo(() => {
        const namesFromDb = categories.map((c) => c.name.trim()).filter(Boolean);
        const namesFromProducts = products.map((p) => getProductCategoryLabel(p.category)).filter(Boolean);
        const combined = Array.from(new Set([...namesFromDb, ...namesFromProducts]));
        return combined.length > 0 ? combined : productCategoryOptions;
    }, [categories, products]);

    const handleProductInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        handleInputChange(e);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Sản phẩm mới bắt đầu ở 0; khi sửa thì giữ nguyên tồn đang có, form này
        // không phải nơi đổi số lượng.
        const stockNum = editingProduct?.stock ?? 0;
        const minStockNum = parseInt(formData.minStock) || 0;
        const productData: ProductItem = {
            id: editingProduct?.id ?? 0,
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            stock: stockNum,
            minStock: minStockNum,
            expiryDate: editingProduct?.expiryDate ?? "",
            warehouseId: editingProduct?.warehouseId ?? "",
            locationId: editingProduct?.locationId ?? "",
            locations: editingProduct?.locations ?? "",
            status: calculateStatus(stockNum, minStockNum),
            // Form sản phẩm hiện chưa cho chỉnh hai cờ này, giữ nguyên giá trị cũ khi sửa.
            requiresLotTracking: editingProduct?.requiresLotTracking ?? false,
            requiresExpiryTracking: editingProduct?.requiresExpiryTracking ?? false,
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
            minStock: product.minStock?.toString() || "",
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
        categories,
        categoryOptions,
        locationOptions,
        isLoading,
        error,
        showModal,
        setShowModal,
        editingProduct,
        setEditingProduct,
        formData,
        setFormData,
        handleInputChange: handleProductInputChange,
        resetForm,
        handleSubmit,
        handleEdit,
        handleDelete,
    };
}