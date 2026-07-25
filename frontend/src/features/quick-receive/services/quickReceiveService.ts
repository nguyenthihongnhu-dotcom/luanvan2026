import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type QuickReceiveInput = {
    productScan: string;
    locationScan: string;
    quantity: number;
    lotNumber?: string;
    expiryDate?: string;
    note?: string;
};

export type QuickReceiveResult = {
    transactionId: number;
    transactionCode: string;
    productVariantId: number;
    sku: string;
    productName: string;
    variantName: string;
    locationId: number;
    locationCode: string;
    warehouseId: number;
    warehouseCode: string;
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    batchId: number | null;
    lotNumber: string | null;
};

export async function quickReceive(input: QuickReceiveInput): Promise<QuickReceiveResult> {
    const response = await httpClient.post<{ data: QuickReceiveResult }>('/stock/quick-receive', input);
    return unwrapData(response);
}

export const quickReceiveService = { quickReceive };