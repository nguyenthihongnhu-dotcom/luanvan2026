import { httpClient, unwrapData } from '@/shared/services/httpClient';
import type { Layer, Shelf, ViTriKho } from '@/features/locations/hooks/useWarehouse';

type BackendLocation = {
    id: number;
    code: string;
    name: string | null;
    layer_no: number;
    status: string;
    zone_code: string;
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
        TrangThai: toLocationStatus(row),
        SanPhamLuuTru: row.name ?? row.code,
    }));
}

export function deriveShelves(locations: ViTriKho[]): Shelf[] {
    return [...new Set(locations.map(location => location.Ke))]
        .sort()
        .map(code => ({ id: code, code, name: `Kệ ${code}` }));
}

export function deriveLayers(locations: ViTriKho[]): Layer[] {
    return [...new Set(locations.map(location => location.Tang))]
        .sort((a, b) => Number(b) - Number(a))
        .map(code => ({ id: code, code, name: `Tầng ${code}` }));
}

export const warehouseService = {
    listWarehouseLocations,
    deriveShelves,
    deriveLayers,
};
