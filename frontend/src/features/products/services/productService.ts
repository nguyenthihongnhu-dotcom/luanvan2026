import { httpClient, unwrapData } from '@/shared/services/httpClient';
import type { ProductItem } from '@/features/products/hooks/useProducts';

type ProductStockRow = {
    warehouse_id?: number;
    sku?: string;
    product_name?: string;
    variant_name?: string;
    product_variant_id?: number;
    total_available_quantity?: string | number;
    min_stock_level?: string | number;
};

type NearExpiryRow = {
    product_variant_id?: number;
    expiry_date?: string;
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
    const [stockResponse, expiryResponse] = await Promise.all([
        httpClient.get<{ data: ProductStockRow[] }>('/reports/product-stock'),
        httpClient.get<{ data: NearExpiryRow[] }>('/reports/near-expiry'),
    ]);
    const stockRows = unwrapData(stockResponse);
    const expiryRows = unwrapData(expiryResponse);
    const expiryByVariant = new Map<number, string>();

    for (const row of expiryRows) {
        if (!row.product_variant_id || !row.expiry_date) continue;
        const current = expiryByVariant.get(row.product_variant_id);
        if (!current || row.expiry_date < current) {
            expiryByVariant.set(row.product_variant_id, row.expiry_date);
        }
    }

    return stockRows.map((row, index) => {
        const stock = toNumber(row.total_available_quantity);
        const minStock = toNumber(row.min_stock_level);
        const variantId = row.product_variant_id ?? index + 1;

        return {
            id: variantId,
            sku: row.sku ?? `SKU-${variantId}`,
            name: row.variant_name || row.product_name || 'San pham',
            category: 'Chua phan loai',
            stock,
            minStock,
            expiryDate: expiryByVariant.get(variantId) ?? '',
            status: calculateStatus(stock, minStock),
        };
    });
}

export const productService = {
    listProducts,
};
