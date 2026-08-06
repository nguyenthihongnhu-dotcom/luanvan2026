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
    warehouse_id?: string | number | null;
    location_id?: string | number | null;
    locations?: string | null;
    requires_lot_tracking?: number | boolean | null;
    requires_expiry_tracking?: number | boolean | null;
};

type BackendLocationRow = {
    id: number;
    code: string;
    warehouse_id: number;
    warehouse_code?: string;
    warehouse_name?: string;
    zone_id?: number;
    zone_code?: string;
    zone_name?: string;
    shelf_id?: number;
    shelf_code?: string;
    shelf_name?: string;
};

export type LocationOption = {
    id: number;
    label: string;
    warehouseId: number;
    warehouseLabel: string;
    zoneId: number;
    zoneLabel: string;
    shelfId: number;
    shelfLabel: string;
};

function toNumber(value: unknown): number {
    const numberValue = Number(value ?? 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
}

function calculateStatus(stock: number, minStock: number): ProductItem['status'] {
    if (stock <= 0) return 'OUT_OF_STOCK';
    if (stock <= minStock) return 'LOW_STOCK';
    return 'IN_STOCK';
}

function toOptionalNumber(value: string): number | undefined {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
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
            name: row.product_name ? (row.variant_name ? `${row.product_name} - ${row.variant_name}` : row.product_name) : (row.variant_name || 'Sản phẩm'),
            category: row.category_name || 'Chưa phân loại',
            stock,
            minStock,
            expiryDate: row.expiry_date ?? '',
            warehouseId: row.warehouse_id ? String(row.warehouse_id) : '',
            locationId: row.location_id ? String(row.location_id) : '',
            locations: row.locations ?? '',
            status: calculateStatus(stock, minStock),
            requiresLotTracking: Boolean(Number(row.requires_lot_tracking ?? 0)),
            requiresExpiryTracking: Boolean(Number(row.requires_expiry_tracking ?? 0)),
        };
    });
}

export async function listLocationOptions(): Promise<LocationOption[]> {
    const response = await httpClient.get<{ data: BackendLocationRow[] }>('/locations');

    return unwrapData(response).map((location) => ({
        id: location.id,
        label: location.code,
        warehouseId: location.warehouse_id,
        warehouseLabel: [location.warehouse_code, location.warehouse_name].filter(Boolean).join(' - '),
        zoneId: location.zone_id ?? 0,
        zoneLabel: [location.zone_code, location.zone_name].filter(Boolean).join(' - '),
        shelfId: location.shelf_id ?? 0,
        shelfLabel: [location.shelf_code, location.shelf_name].filter(Boolean).join(' - '),
    }));
}

export async function createProduct(input: ProductItem): Promise<void> {
    await httpClient.post('/catalog/products', {
        sku: input.sku,
        name: input.name,
        category: input.category,
        stock: input.stock,
        minStock: input.minStock,
        expiryDate: input.expiryDate || undefined,
        locationId: toOptionalNumber(input.locationId),
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
        locationId: toOptionalNumber(input.locationId),
    });
}

export async function deleteProduct(id: number): Promise<void> {
    await httpClient.delete(`/catalog/products/${id}`);
}
export const productService = {
    listProducts,
    listLocationOptions,
    createProduct,
    updateProduct,
    deleteProduct,
};
