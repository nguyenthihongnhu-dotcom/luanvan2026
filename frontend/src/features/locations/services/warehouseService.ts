import { HttpError, httpClient, unwrapData } from '@/shared/services/httpClient';
import type { Layer, Shelf, ViTriKho } from '@/features/locations/hooks/useWarehouse';

export interface LocationHistoryItem {
    id: number;
    transaction_code: string;
    transaction_type: string;
    direction: 'IN' | 'OUT';
    quantity: string | number;
    quantity_before: string | number | null;
    quantity_after: string | number | null;
    reference_type: string | null;
    reference_id: number | null;
    reason_code: string | null;
    note: string | null;
    created_at: string;
    sku: string;
    product_name: string;
    variant_name: string;
    performed_by_name: string | null;
}

type BackendLocation = {
    id: number;
    code: string;
    name: string | null;
    layer_no: number;
    status: string;
    zone_code: string;
    shelf_id: number;
    shelf_code: string;
    shelf_name: string;
    current_quantity: string | number;
};

function toLocationStatus(row: BackendLocation): ViTriKho['TrangThai'] {
    const quantity = Number(row.current_quantity ?? 0);
    if (quantity <= 0) return 'Trong';
    if (row.status === 'FULL') return 'Day';
    return 'DangChua';
}

export async function listWarehouseLocations(): Promise<ViTriKho[]> {
    const response = await httpClient.get<{ data: BackendLocation[] }>('/locations');

    return unwrapData(response).map(row => ({
        MaViTri: row.id,
        KhuVuc: row.zone_code,
        Ke: row.shelf_code,
        Tang: String(row.layer_no).padStart(2, '0'),
        MaViTriCha: null,
        MaKe: row.shelf_id,
        TrangThai: toLocationStatus(row),
        SanPhamLuuTru: row.name ?? row.code,
    }));
}

export function deriveShelves(locations: ViTriKho[]): Shelf[] {
    const byCode = new Map<string, Shelf>();
    for (const location of locations) {
        if (!byCode.has(location.Ke)) {
            byCode.set(location.Ke, { id: String(location.MaKe ?? location.Ke), code: location.Ke, name: `Kệ ${location.Ke}` });
        }
    }
    return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export function deriveLayers(locations: ViTriKho[]): Layer[] {
    return [...new Set(locations.map(location => location.Tang))]
        .sort((a, b) => Number(b) - Number(a))
        .map(code => ({ id: code, code, name: `Tầng ${code}` }));
}

export async function createLocation(input: { shelfId: number; code: string; layerNo: number; name?: string }): Promise<void> {
    await httpClient.post('/locations', input);
}

export async function deleteShelf(shelfId: number): Promise<void> {
    await httpClient.delete(`/locations/shelf/${shelfId}`);
}

export async function deleteLayer(shelfId: number, layerNo: number): Promise<void> {
    await httpClient.delete(`/locations/layer?shelfId=${shelfId}&layerNo=${layerNo}`);
}

export async function createShelf(input: { zoneCode: string; code?: string; name?: string; layerCount?: number }): Promise<void> {
    await httpClient.post('/locations/shelves', input);
}

export async function createZone(input: { code: string; name?: string; shelfCount?: number; layerCount?: number }): Promise<void> {
    await httpClient.post('/locations/zones', input);
}

export async function listLocationHistory(locationId: number): Promise<LocationHistoryItem[]> {
    try {
        const response = await httpClient.get<{ data: LocationHistoryItem[] }>(`/locations/${locationId}/history`);
        return unwrapData(response);
    } catch (error) {
        if (error instanceof HttpError && error.status > 0) {
            console.warn('Location history API returned an error; rendering empty history.', error);
            return [];
        }

        throw error;
    }
}

export async function reorderShelves(shelfIds: number[]): Promise<void> {
    await httpClient.put('/locations/shelves/reorder', { shelfIds });
}

export const warehouseService = {
    listWarehouseLocations,
    deriveShelves,
    deriveLayers,
    createLocation,
    createShelf,
    createZone,
    deleteShelf,
    deleteLayer,
    listLocationHistory,
    reorderShelves,
};