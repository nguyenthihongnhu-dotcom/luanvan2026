import { useEffect, useState } from "react";
import { warehouseService } from "@/features/locations/services/warehouseService";

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
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [layers, setLayers] = useState<Layer[]>([]);
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [locations, setLocations] = useState<ViTriKho[]>([]);
    const [activeLocation, setActiveLocation] = useState<ViTriKho | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadLocations = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await warehouseService.listWarehouseLocations();
            setLocations(result);
            setShelves(warehouseService.deriveShelves(result));
            setLayers(warehouseService.deriveLayers(result));
        } catch (err) {
            console.error('Failed to load locations from backend:', err);
            setError('Không tải được vị trí kho từ backend.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { void loadLocations(); }, []);


    const handleAddZone = async (code: string, name?: string) => {
        await warehouseService.createZone({ code, name, shelfCount: 1, layerCount: 3 });
        await loadLocations();
        setSelectedZone(code);
    };
    const getLocationInfo = (shelfCode: string, layerCode: string) => {
        return locations.find((loc) => loc.KhuVuc === selectedZone && loc.Ke === shelfCode && loc.Tang === layerCode);
    };

        const handleAddShelf = async () => {
        if (!selectedZone) return;
        const nextCodeInt = shelves.length > 0
            ? Math.max(...shelves.map(shelf => parseInt(shelf.code) || 0)) + 1
            : 1;
        const shelfCode = nextCodeInt.toString().padStart(2, '0');

        await warehouseService.createShelf({
            zoneCode: selectedZone,
            code: shelfCode,
            name: `Kệ ${shelfCode}`,
            layerCount: Math.max(layers.length, 1),
        });
        await loadLocations();
    };

    const handleAddLayer = async () => {
        const nextCodeInt = layers.length > 0 ? Math.max(...layers.map(layer => parseInt(layer.code) || 0)) + 1 : 1;
        const layerCode = nextCodeInt.toString().padStart(2, '0');
        const targetShelves = shelves.filter((shelf) => Number.isFinite(Number(shelf.id)));

        for (const shelf of targetShelves) {
            await warehouseService.createLocation({
                shelfId: Number(shelf.id),
                code: `${selectedZone || 'ZONE'}-${shelf.code}-${layerCode}-${Date.now()}`,
                layerNo: nextCodeInt,
                name: `Tầng ${layerCode}`,
            });
        }

        await loadLocations();
    };

    const handleDeleteShelf = async (shelfId: string, shelfCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa kệ ${shelfCode}?`)) return;
        const numericShelfId = Number(shelfId);
        if (Number.isFinite(numericShelfId)) {
            await warehouseService.deleteShelf(numericShelfId);
            await loadLocations();
            setActiveLocation(null);
        }
    };

    const handleDeleteLayer = async (_layerId: string, layerCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa tầng ${layerCode}?`)) return;
        const targetLocations = locations.filter(l => l.KhuVuc === selectedZone && l.Tang === layerCode && l.MaKe);
        for (const location of targetLocations) {
            await warehouseService.deleteLayer(location.MaKe!, Number(layerCode));
        }
        await loadLocations();
        setActiveLocation(null);
    };

    return {
        selectedZone,
        setSelectedZone,
        layers,
        shelves,
        locations,
        isLoading,
        error,
        activeLocation,
        setActiveLocation,
        getLocationInfo,
        handleAddZone,
        handleAddShelf,
        handleAddLayer,
        handleDeleteShelf,
        handleDeleteLayer,
    };
}