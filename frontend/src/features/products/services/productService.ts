import { httpClient, unwrapData } from '@/shared/services/httpClient';
import type { ProductItem } from '@/features/products/hooks/useProducts';

type CatalogProductRow = {
    id?: number;
    sku?: string;
    product_name?: string;
    variant_name?: string;
    category_name?: string;
    stock?: string | number;
    min_stock_level?: string | number;
    expiry_date?: string | null;
    locations?: string | null;
};

function toNumber(value: unknown): number {
    const numberValue = Number(value ?? 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
}

function calculateStatus(stock: number, minStock: number): ProductItem['status'] {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= minStock) return 'Low Stock';
    return 'In Stock';
}

export async function listProducts(): Promise<ProductItem[]> {
    const response = await httpClient.get<{ data: CatalogProductRow[] }>('/catalog/products');
    const rows = unwrapData(response);

    return rows.map((row, index) => {
        const variantId = row.id ?? index + 1;
        const stock = toNumber(row.stock);
        const minStock = toNumber(row.min_stock_level);

        return {
            id: variantId,
            sku: row.sku ?? `SKU-${variantId}`,
            name: row.variant_name || row.product_name || 'San pham',
            category: row.category_name || 'Chua phan loai',
            stock,
            minStock,
            expiryDate: row.expiry_date ?? '',
            locations: row.locations ?? '',
            status: calculateStatus(stock, minStock),
        };
    });
}

export async function createProduct(input: ProductItem): Promise<void> {
    await httpClient.post('/catalog/products', {
        sku: input.sku,
        name: input.name,
        category: input.category,
        stock: input.stock,
        minStock: input.minStock,
        expiryDate: input.expiryDate || undefined,
    });
}

export async function updateProduct(id: number, input: ProductItem): Promise<void> {
    await httpClient.put(`/catalog/products/${id}`, {
        sku: input.sku,
        name: input.name,
        category: input.category,
        stock: input.stock,
        minStock: input.minStock,
        expiryDate: input.expiryDate || undefined,
    });
}

export async function deleteProduct(id: number): Promise<void> {
    await httpClient.delete(`/catalog/products/${id}`);
}
export const productService = {
    listProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
