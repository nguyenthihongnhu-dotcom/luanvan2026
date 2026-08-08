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
    stored_products?: string | null;
};

function toLocationStatus(row: BackendLocation): ViTriKho['TrangThai'] {
    const quantity = Number(row.current_quantity ?? 0);
    if (quantity <= 0) return 'Trong';
    if (row.status === 'FULL') return 'Day';
    return 'DangChua';
}

export async function listWarehouseLocations(warehouseId?: number): Promise<ViTriKho[]> {
    const url = warehouseId ? `/locations?warehouseId=${warehouseId}` : '/locations';
    const response = await httpClient.get<{ data: BackendLocation[] }>(url);

    return unwrapData(response).map(row => ({
        MaViTri: row.id,
        KhuVuc: row.zone_code,
        Ke: row.shelf_code,
        Tang: String(row.layer_no).padStart(2, '0'),
        MaViTriCha: null,
        MaKe: row.shelf_id,
        TrangThai: toLocationStatus(row),
        SanPhamLuuTru: row.stored_products ?? "",
    }));
}

export function deriveShelves(locations: ViTriKho[]): Shelf[] {
    const byCode = new Map<string, Shelf>();
    for (const location of locations) {
        if (!byCode.has(location.Ke)) {
            byCode.set(location.Ke, { id: String(location.MaKe ?? location.Ke), code: location.Ke, name: `Kệ ${location.Ke}` });
        }
    }
    return [...byCode.values()];
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

// warehouseId là bắt buộc với mọi thao tác ghi: mã khu chỉ duy nhất trong phạm vi một kho
// (uq_zone_code UNIQUE(warehouse_id, code)), thiếu nó thì backend không biết đang thao tác
// trên kho nào và thao tác sẽ rơi nhầm sang kho khác.
export async function createShelf(input: { zoneCode: string; warehouseId: number; code?: string; name?: string; layerCount?: number }): Promise<void> {
    await httpClient.post('/locations/shelves', input);
}

export async function createLayer(input: { zoneCode: string; warehouseId: number; layerNo?: number }): Promise<void> {
    await httpClient.post('/locations/layers', input);
}

export async function syncLocationMatrix(input: { zoneCode: string; warehouseId: number }): Promise<{ createdLocationCount: number }> {
    const response = await httpClient.post<{ data: { createdLocationCount: number } }>('/locations/sync-matrix', input);
    return unwrapData(response);
}

export type ZoneOrientation = 'HORIZONTAL' | 'VERTICAL';

export interface WarehouseZone {
    id: number;
    warehouseId: number;
    code: string;
    name: string;
    status: string;
    sortOrder: number;
    gridRow: number | null;
    gridCol: number | null;
    gridSize: number | null;
    /** Hướng xếp kệ riêng của khu này, không phải chế độ xem chung của mặt bằng. */
    gridOrientation: ZoneOrientation;
    shelfCount: number;
    locationCount: number;
    /** Số vị trí đang có hàng (quantity > 0). */
    occupiedCount: number;
    /** Số vị trí đã đánh dấu trạng thái FULL. */
    fullCount: number;
}

type BackendZone = {
    id: number;
    warehouse_id: number;
    code: string;
    name: string;
    status: string;
    sort_order: number;
    grid_row: number | null;
    grid_col: number | null;
    grid_size: number | null;
    grid_orientation: ZoneOrientation | null;
    shelf_count: number | string;
    location_count: number | string;
    occupied_count?: number | string;
    full_count?: number | string;
};

/** Đọc khu trực tiếp từ bảng warehouse_zones nên khu chưa có kệ nào vẫn hiện ra. */
export async function listZones(warehouseId: number): Promise<WarehouseZone[]> {
    const response = await httpClient.get<{ data: BackendZone[] }>(`/locations/zones?warehouseId=${warehouseId}`);
    return unwrapData(response).map((row) => ({
        id: row.id,
        warehouseId: row.warehouse_id,
        code: row.code,
        name: row.name,
        status: row.status,
        sortOrder: row.sort_order,
        gridRow: row.grid_row,
        gridCol: row.grid_col,
        gridSize: row.grid_size,
        gridOrientation: row.grid_orientation ?? 'HORIZONTAL',
        shelfCount: Number(row.shelf_count ?? 0),
        locationCount: Number(row.location_count ?? 0),
        occupiedCount: Number(row.occupied_count ?? 0),
        fullCount: Number(row.full_count ?? 0),
    }));
}

export async function createZone(input: {
    warehouseId: number;
    code: string;
    name?: string;
    shelfCount?: number;
    layerCount?: number;
    gridRow?: number | null;
    gridCol?: number | null;
    gridSize?: number | null;
}): Promise<void> {
    await httpClient.post('/locations/zones', input);
}

/** Xóa khu. Backend từ chối (409 ZONE_NOT_EMPTY) nếu trong khu còn vị trí có hàng. */
export async function deleteZone(zoneId: number): Promise<void> {
    await httpClient.delete(`/locations/zones/${zoneId}`);
}

export async function updateZoneLayout(
    zoneId: number,
    layout: {
        gridRow: number | null;
        gridCol: number | null;
        gridSize: number | null;
        /** Bỏ trống thì backend giữ nguyên hướng đang lưu. */
        gridOrientation?: ZoneOrientation;
    },
): Promise<void> {
    await httpClient.put(`/locations/zones/${zoneId}/layout`, layout);
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
    listZones,
    deriveShelves,
    deriveLayers,
    createLocation,
    createShelf,
    createLayer,
    syncLocationMatrix,
    createZone,
    deleteZone,
    updateZoneLayout,
    deleteShelf,
    deleteLayer,
    listLocationHistory,
    reorderShelves,
};
