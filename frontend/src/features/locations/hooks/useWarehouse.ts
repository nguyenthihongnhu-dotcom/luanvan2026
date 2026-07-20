import { useEffect, useState } from "react";
import { warehouseService } from "@/features/locations/services/warehouseService";

export interface ViTriKho {
    MaViTri: number;
    KhuVuc: string;
    Ke: string;
    Tang: string;
    MaViTriCha: number | null;
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

const mockShelves: Shelf[] = [
    { id: 's1', code: '01', name: 'Kệ 01' },
    { id: 's2', code: '02', name: 'Kệ 02' },
    { id: 's3', code: '03', name: 'Kệ 03' },
];

const mockLayers: Layer[] = [
    { id: 'l3', code: '03', name: 'Tầng 03' },
    { id: 'l2', code: '02', name: 'Tầng 02' },
    { id: 'l1', code: '01', name: 'Tầng 01' },
];

const generateMockLocations = (): ViTriKho[] => {
    const list: ViTriKho[] = [];
    let id = 1;
    const zones = ['A', 'B', 'C', 'D', 'E'];
    const shelves = ['01', '02', '03'];
    const layers = ['01', '02', '03'];

    zones.forEach(zone => {
        shelves.forEach(shelf => {
            layers.forEach(layer => {
                list.push({
                    MaViTri: id++,
                    KhuVuc: zone,
                    Ke: shelf,
                    Tang: layer,
                    MaViTriCha: null,
                    TrangThai: 'Trong',
                });
            });
        });
    });

    return list;
};

const mockLocations = generateMockLocations();

export function useWarehouse() {
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [layers, setLayers] = useState<Layer[]>(mockLayers);
    const [shelves, setShelves] = useState<Shelf[]>(mockShelves);
    const [locations, setLocations] = useState<ViTriKho[]>(mockLocations);
    const [activeLocation, setActiveLocation] = useState<ViTriKho | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadLocations() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await warehouseService.listWarehouseLocations();
                if (isMounted && result.length > 0) {
                    setLocations(result);
                    setShelves(warehouseService.deriveShelves(result));
                    setLayers(warehouseService.deriveLayers(result));
                }
            } catch (err) {
                console.error('Failed to load locations from backend:', err);
                if (isMounted) {
                    setError('Không tải được vị trí kho từ backend, đang hiển thị dữ liệu mẫu.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadLocations();

        return () => {
            isMounted = false;
        };
    }, []);

    const getLocationInfo = (shelfCode: string, layerCode: string) => {
        return locations.find((loc) =>
            loc.KhuVuc === selectedZone && loc.Ke === shelfCode && loc.Tang === layerCode
        );
    };

    const handleAddShelf = () => {
        const nextCodeInt = shelves.length > 0
            ? Math.max(...shelves.map(shelf => parseInt(shelf.code) || 0)) + 1
            : 1;
        const shelfCode = nextCodeInt.toString().padStart(2, '0');
        const newShelf: Shelf = { id: `s${nextCodeInt}`, code: shelfCode, name: `Kệ ${shelfCode}` };
        let currentMaxId = locations.length > 0 ? Math.max(...locations.map(l => l.MaViTri)) : 0;
        const newLocationsForShelf = layers.map((layer) => ({
            MaViTri: ++currentMaxId,
            KhuVuc: selectedZone || '',
            Ke: shelfCode,
            Tang: layer.code,
            MaViTriCha: null,
            TrangThai: 'Trong' as const,
        }));

        setShelves([...shelves, newShelf]);
        setLocations([...locations, ...newLocationsForShelf]);
    };

    const handleAddLayer = () => {
        const nextCodeInt = layers.length > 0
            ? Math.max(...layers.map(layer => parseInt(layer.code) || 0)) + 1
            : 1;
        const layerCode = nextCodeInt.toString().padStart(2, '0');
        const newLayer: Layer = { id: `l${nextCodeInt}`, code: layerCode, name: `Tầng ${layerCode}` };
        let currentMaxId = locations.length > 0 ? Math.max(...locations.map(l => l.MaViTri)) : 0;
        const newLocationsForLayer = shelves.map(shelf => ({
            MaViTri: ++currentMaxId,
            KhuVuc: selectedZone || '',
            Ke: shelf.code,
            Tang: layerCode,
            MaViTriCha: null,
            TrangThai: 'Trong' as const,
        }));

        setLayers([newLayer, ...layers]);
        setLocations([...locations, ...newLocationsForLayer]);
    };

    const handleDeleteShelf = (shelfId: string, shelfCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa kệ ${shelfCode}?`)) return;
        setShelves(shelves.filter(s => s.id !== shelfId));
        setLocations(locations.filter(l => !(l.KhuVuc === selectedZone && l.Ke === shelfCode)));
        if (activeLocation?.KhuVuc === selectedZone && activeLocation?.Ke === shelfCode) {
            setActiveLocation(null);
        }
    };

    const handleDeleteLayer = (layerId: string, layerCode: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa tầng ${layerCode}?`)) return;
        setLayers(layers.filter(l => l.id !== layerId));
        setLocations(locations.filter(l => !(l.KhuVuc === selectedZone && l.Tang === layerCode)));
        if (activeLocation?.KhuVuc === selectedZone && activeLocation?.Tang === layerCode) {
            setActiveLocation(null);
        }
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
        handleAddShelf,
        handleAddLayer,
        handleDeleteShelf,
        handleDeleteLayer,
    };
}
