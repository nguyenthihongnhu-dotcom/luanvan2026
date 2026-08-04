import { useEffect, useMemo, useState } from "react";
import { warehouseService } from "@/features/locations/services/warehouseService";
import { warehouseService as masterWarehouseService, type WarehouseOption } from "@/features/warehouses/services/warehouseService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";

export interface ViTriKho {
    MaViTri: number;
    KhuVuc: string;
    Ke: string;
    Tang: string;
    MaViTriCha: number | null;
    MaKe?: number;
    TrangThai: 'Trong' | 'DangChua' | 'Day';
    SanPhamLuuTru?: string;
}

export interface Shelf {
    id: string;
    code: string;
    name: string;
}

export interface Layer {
    id: string;
    code: string;
    name: string;
}

export function useWarehouse() {
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [locations, setLocations] = useState<ViTriKho[]>([]);
    const [activeLocation, setActiveLocation] = useState<ViTriKho | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadWarehouses = async () => {
        try {
            const list = await masterWarehouseService.listWarehouses({ status: 'ACTIVE' });
            setWarehouses(list);
            if (list.length > 0 && !selectedWarehouseId) {
                setSelectedWarehouseId(list[0].id);
            }
        } catch (err) {
            console.error('Failed to load warehouses:', err);
        }
    };

    useEffect(() => {
        void loadWarehouses();
    }, []);

    const zoneLocations = useMemo(() => {
        if (!selectedZone) return locations;
        return locations.filter((location) => location.KhuVuc === selectedZone);
    }, [locations, selectedZone]);

    const shelves = useMemo(() => warehouseService.deriveShelves(zoneLocations), [zoneLocations]);
    const layers = useMemo(() => warehouseService.deriveLayers(zoneLocations), [zoneLocations]);

    const loadLocations = async (whId?: number | null) => {
        setIsLoading(true);
        setError(null);
        try {
            const targetWhId = whId ?? selectedWarehouseId ?? undefined;
            const result = await warehouseService.listWarehouseLocations(targetWhId);
            setLocations(result);
        } catch (err) {
            console.error('Failed to load locations from backend:', err);
            setError(getHttpErrorMessage(err, 'Không tải được vị trí kho từ backend'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedWarehouseId !== null) {
            void loadLocations(selectedWarehouseId);
        } else {
            void loadLocations();
        }
    }, [selectedWarehouseId]);

    const runMutation = async (operation: () => Promise<void>, fallback: string) => {
        if (isSaving) return;
        setIsSaving(true);
        setError(null);
        try {
            await operation();
            await loadLocations(selectedWarehouseId);
        } catch (err) {
            console.error(fallback, err);
            setError(getHttpErrorMessage(err, fallback));
            window.alert(fallback);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddZone = async (code: string, name?: string, shelfCount = 4, layerCount = 4) => {
        await runMutation(async () => {
            await warehouseService.createZone({
                warehouseId: selectedWarehouseId ?? undefined,
                code,
                name,
                shelfCount,
                layerCount,
            });
            setSelectedZone(code);
        }, 'Không thêm được khu vực kho.');
    };

    const getLocationInfo = (shelfCode: string, layerCode: string) => {
        return locations.find((loc) => loc.KhuVuc === selectedZone && loc.Ke === shelfCode && loc.Tang === layerCode);
    };

    const handleAddShelf = async () => {
        if (!selectedZone) return;
        await runMutation(async () => {
            if (zoneLocations.length === 0) {
                await warehouseService.createZone({
                    warehouseId: selectedWarehouseId ?? undefined,
                    code: selectedZone,
                    name: `Khu vực ${selectedZone}`,
                    shelfCount: 1,
                    layerCount: Math.max(layers.length, 1),
                });
                return;
            }

            const nextCodeInt = shelves.length > 0
                ? Math.max(...shelves.map(shelf => parseInt(shelf.code, 10) || 0)) + 1
                : 1;
            const shelfCode = nextCodeInt.toString().padStart(2, '0');

            await warehouseService.createShelf({
                zoneCode: selectedZone,
                warehouseId: selectedWarehouseId ?? undefined,
                code: shelfCode,
                name: `Kệ ${shelfCode}`,
                layerCount: Math.max(layers.length, 1),
            });
        }, 'Không thêm được kệ. Kiểm tra khu vực kho đã tồn tại trong MySQL chưa.');
    };

    const handleAddLayer = async () => {
        if (!selectedZone) return;
        await runMutation(async () => {
            if (zoneLocations.length === 0) {
                await warehouseService.createZone({
                    warehouseId: selectedWarehouseId ?? undefined,
                    code: selectedZone,
                    name: `Khu vực ${selectedZone}`,
                    shelfCount: 1,
                    layerCount: 1,
                });
                return;
            }

            const nextCodeInt = layers.length > 0 ? Math.max(...layers.map(layer => parseInt(layer.code, 10) || 0)) + 1 : 1;
            const targetShelves = shelves.filter((shelf) => Number.isFinite(Number(shelf.id)));

            if (targetShelves.length === 0) {
                await warehouseService.createShelf({
                    zoneCode: selectedZone,
                    warehouseId: selectedWarehouseId ?? undefined,
                    code: '01',
                    name: 'Kệ 01',
                    layerCount: nextCodeInt,
                });
                return;
            }

            await warehouseService.createLayer({
                zoneCode: selectedZone,
                warehouseId: selectedWarehouseId ?? undefined,
                layerNo: nextCodeInt,
            });
        }, 'Không thêm được tầng. Kiểm tra khu vực/kệ trong MySQL.');
    };

    const handleSyncMatrix = async () => {
        if (!selectedZone) return;
        await runMutation(async () => {
            await warehouseService.syncLocationMatrix({
                zoneCode: selectedZone,
                warehouseId: selectedWarehouseId ?? undefined,
            });
        }, 'Không đồng bộ được ma trận kệ/tầng.');
    };

    const handleReorderShelves = async (sourceShelfId: string, targetShelfId: string) => {
        if (sourceShelfId === targetShelfId) return;
        const sourceIndex = shelves.findIndex((shelf) => shelf.id === sourceShelfId);
        const targetIndex = shelves.findIndex((shelf) => shelf.id === targetShelfId);
        if (sourceIndex < 0 || targetIndex < 0) return;

        await runMutation(async () => {
            const reordered = [...shelves];
            const [movedShelf] = reordered.splice(sourceIndex, 1);
            reordered.splice(targetIndex, 0, movedShelf);
            const shelfIds = reordered.map((shelf) => Number(shelf.id));
            if (shelfIds.some((id) => !Number.isFinite(id))) {
                throw new Error('Danh sách kệ không hợp lệ.');
            }
            await warehouseService.reorderShelves(shelfIds);
        }, 'Không lưu được thứ tự kệ.');
    };

    const handleDeleteShelf = async (shelfId: string, shelfCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa kệ ${shelfCode}?`)) return;
        await runMutation(async () => {
            const numericShelfId = Number(shelfId);
            if (!Number.isFinite(numericShelfId)) throw new Error('Mã kệ không hợp lệ.');
            await warehouseService.deleteShelf(numericShelfId);
            setActiveLocation(null);
        }, 'Không xóa được kệ.');
    };

    const handleDeleteLayer = async (_layerId: string, layerCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa tầng ${layerCode}?`)) return;
        await runMutation(async () => {
            const targetLocations = locations.filter(l => l.KhuVuc === selectedZone && l.Tang === layerCode && l.MaKe);
            for (const location of targetLocations) {
                await warehouseService.deleteLayer(location.MaKe!, Number(layerCode));
            }
            setActiveLocation(null);
        }, 'Không xóa được tầng.');
    };

    return {
        warehouses,
        selectedWarehouseId,
        setSelectedWarehouseId,
        selectedZone,
        setSelectedZone,
        layers,
        shelves,
        locations,
        isLoading,
        isSaving,
        error,
        activeLocation,
        setActiveLocation,
        getLocationInfo,
        handleAddZone,
        handleAddShelf,
        handleAddLayer,
        handleSyncMatrix,
        handleReorderShelves,
        handleDeleteShelf,
        handleDeleteLayer,
    };
}
