import { useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "@/shared/hooks/useForm";

// Äá»‹nh nghÄ©a kiá»ƒu dá»¯ liá»‡u cá»§a má»™t Ä‘á»‘i tÆ°á»£ng sáº£n pháº©m
export interface ProductItem {
    id: number;
    sku: string;           // MÃ£ SKU cá»§a sáº£n pháº©m (vd: BIM-HUG-M)
    name: string;          // TÃªn sáº£n pháº©m
    category: string;      // Danh má»¥c sáº£n pháº©m (Bá»‰m tÃ£, Sá»¯a cÃ´ng thá»©c...)
    stock: number;         // Sá»‘ lÆ°á»£ng tá»“n kho thá»±c táº¿
    minStock: number;      // Sá»‘ lÆ°á»£ng tá»“n kho tá»‘i thiá»ƒu Ä‘á»ƒ cáº£nh bÃ¡o
    expiryDate: string;    // Háº¡n sá»­ dá»¥ng cá»§a sáº£n pháº©m
    status: "In Stock" | "Low Stock" | "Out of Stock"; // Tráº¡ng thÃ¡i tá»“n kho
}

/**
 * TÃ­nh toÃ¡n tá»± Ä‘á»™ng tráº¡ng thÃ¡i tá»“n kho cá»§a sáº£n pháº©m dá»±a trÃªn sá»‘ lÆ°á»£ng tá»“n thá»±c táº¿
 * @param stock Sá»‘ lÆ°á»£ng tá»“n thá»±c táº¿
 * @param minStock NgÆ°á»¡ng tá»“n tá»‘i thiá»ƒu
 * @returns Tráº¡ng thÃ¡i sáº£n pháº©m
 */
export const calculateStatus = (stock: number, minStock: number): ProductItem["status"] => {
    if (stock <= 0) return "Out of Stock";  // Háº¿t hÃ ng
    if (stock <= minStock) return "Low Stock"; // Sáº¯p háº¿t hÃ ng
    return "In Stock"; // CÃ²n hÃ ng
};

// Tráº¡ng thÃ¡i biá»ƒu máº«u trá»‘ng ban Ä‘áº§u Ä‘á»ƒ thiáº¿t láº­p khi táº¡o má»›i
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
 * Quáº£n lÃ½ toÃ n bá»™ tráº¡ng thÃ¡i danh má»¥c sáº£n pháº©m, bá»™ lá»c, Ä‘Ã³ng/má»Ÿ modal vÃ  cÃ¡c thao tÃ¡c CRUD.
 */
export function useProducts() {
    // Tráº¡ng thÃ¡i hiá»ƒn thá»‹ modal biá»ƒu máº«u (ThÃªm/Sá»­a)
    const [showModal, setShowModal] = useState(false);
    
    // Tráº¡ng thÃ¡i sáº£n pháº©m Ä‘ang Ä‘Æ°á»£c chá»‰nh sá»­a (null náº¿u Ä‘ang á»Ÿ cháº¿ Ä‘á»™ thÃªm má»›i)
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

    // Sá»­ dá»¥ng hook useForm dÃ¹ng chung Ä‘á»ƒ Ä‘á»“ng bá»™ dá»¯ liá»‡u biá»ƒu máº«u
    const { formData, setFormData, handleInputChange, resetForm } = useForm(initialFormState);

    // Danh sÃ¡ch sáº£n pháº©m khá»Ÿi táº¡o ban Ä‘áº§u, tá»± Ä‘á»™ng tÃ­nh toÃ¡n tráº¡ng thÃ¡i status
    const [products, setProducts] = useState<ProductItem[]>(
        [
            { id: 1, sku: "BIM-HUG-M", name: "TÃ£ quáº§n Huggies Size M", category: "Bá»‰m tÃ£", stock: 150, minStock: 10, expiryDate: "2023-12-31" },
            { id: 2, sku: "SUA-FRISO-3", name: "Sá»¯a Frisolac Gold Sá»‘ 3", category: "Sá»¯a cÃ´ng thá»©c", stock: 8, minStock: 20, expiryDate: "2023-11-30" },
            { id: 3, sku: "TI-GIAM-CHICCO", name: "Ti giáº£ Chicco silicone", category: "Äá»“ sÆ¡ sinh", stock: 0, minStock: 5, expiryDate: "2023-10-31" },
        ].map(p => ({ ...p, status: calculateStatus(p.stock, p.minStock) }))
    );

    /**
     * Xá»­ lÃ½ sá»± kiá»‡n Submit Form (LÆ°u sáº£n pháº©m má»›i hoáº·c LÆ°u chá»‰nh sá»­a)
     */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Chuyá»ƒn Ä‘á»•i chuá»—i Ä‘áº§u vÃ o tá»« form sang dáº¡ng sá»‘ nguyÃªn
        const stockNum = parseInt(formData.stock) || 0;
        const minStockNum = parseInt(formData.minStock) || 0;

        // Chuáº©n bá»‹ Ä‘á»‘i tÆ°á»£ng dá»¯ liá»‡u sáº£n pháº©m má»›i
        const productData = {
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            stock: stockNum,
            minStock: minStockNum,
            expiryDate: formData.expiryDate,
            status: calculateStatus(stockNum, minStockNum), // TÃ­nh toÃ¡n láº¡i tráº¡ng thÃ¡i hÃ ng
        };

        if (editingProduct) {
            // Cháº¿ Ä‘á»™ chá»‰nh sá»­a: Duyá»‡t máº£ng vÃ  thay tháº¿ pháº§n tá»­ Ä‘ang sá»­a báº±ng dá»¯ liá»‡u má»›i
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        } else {
            // Cháº¿ Ä‘á»™ thÃªm má»›i: TÃ¬m ID lá»›n nháº¥t hiá»‡n táº¡i Ä‘á»ƒ sinh ID tiáº¿p theo
            const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            setProducts([...products, { id: newId, ...productData }]);
        }

        // ÄÃ³ng modal vÃ  reset tráº¡ng thÃ¡i chá»‰nh sá»­a
        setShowModal(false);
        setEditingProduct(null);
    };

    /**
     * KÃ­ch hoáº¡t cháº¿ Ä‘á»™ chá»‰nh sá»­a sáº£n pháº©m
     * @param product Äá»‘i tÆ°á»£ng sáº£n pháº©m Ä‘Æ°á»£c chá»n Ä‘á»ƒ sá»­a
     */
    const handleEdit = (product: ProductItem) => {
        setEditingProduct(product);
        // Äá»• dá»¯ liá»‡u sáº£n pháº©m Ä‘ang chá»n vÃ o biá»ƒu máº«u form
        setFormData({
            sku: product.sku,
            name: product.name,
            category: product.category,
            stock: product.stock.toString(),
            minStock: product.minStock?.toString() || '',
            expiryDate: product.expiryDate || '',
        });
        // Má»Ÿ modal biá»ƒu máº«u lÃªn
        setShowModal(true);
    };

    /**
     * XÃ³a sáº£n pháº©m ra khá»i danh má»¥c
     * @param id ID cá»§a sáº£n pháº©m cáº§n xÃ³a
     */
    const handleDelete = async (id: number) => {
        if (!window.confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a sáº£n pháº©m nÃ y?")) return;
        try {
            // Lá»c bá» pháº§n tá»­ cÃ³ ID bá»‹ xÃ³a khá»i máº£ng
            setProducts(products.filter(p => p.id !== id));
        } catch (err: unknown) {
            console.error("Lá»—i khi xÃ³a sáº£n pháº©m:", err);
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


