import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type ReportRow = Record<string, string | number | null> & { id?: number };

export interface ReportFilters {
    search?: string;
    warehouseId?: string;
    productVariantId?: string;
    dateFrom?: string;
    dateTo?: string;
}

function buildQuery(filters: ReportFilters = {}): string {
    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.warehouseId?.trim()) params.set('warehouseId', filters.warehouseId.trim());
    if (filters.productVariantId?.trim()) params.set('productVariantId', filters.productVariantId.trim());
    if (filters.dateFrom?.trim()) params.set('dateFrom', filters.dateFrom.trim());
    if (filters.dateTo?.trim()) params.set('dateTo', filters.dateTo.trim());
    const query = params.toString();
    return query ? `?${query}` : '';
}

async function getReport(path: string, filters: ReportFilters): Promise<ReportRow[]> {
    const response = await httpClient.get<{ data: ReportRow[] }>(`${path}${buildQuery(filters)}`);
    return unwrapData(response);
}

export const reportService = {
    productStock: (filters: ReportFilters) => getReport('/reports/product-stock', filters),
    nearExpiry: (filters: ReportFilters) => getReport('/reports/near-expiry', filters),
    inventoryMovements: (filters: ReportFilters) => getReport('/reports/inventory-movements', filters),
    inventoryTransactions: (filters: ReportFilters) => getReport('/reports/inventory-transactions', filters),
};
