import { useEffect, useMemo, useRef, useState } from "react";
import { warehouseService, type WarehouseZone } from "@/features/locations/services/warehouseService";
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
    const [zones, setZones] = useState<WarehouseZone[]>([]);
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
            const [locationResult, zoneResult] = await Promise.all([
                warehouseService.listWarehouseLocations(targetWhId),
                // Danh sách khu đọc riêng từ warehouse_zones, không suy ra từ vị trí,
                // nhờ vậy khu mới tạo mà chưa có kệ nào vẫn hiện trên mặt bằng.
                targetWhId ? warehouseService.listZones(targetWhId) : Promise.resolve([]),
            ]);
            setLocations(locationResult);
            setZones(zoneResult);
        } catch (err) {
            console.error('Failed to load locations from backend:', err);
            setError(getHttpErrorMessage(err, 'Không tải được vị trí kho từ backend'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Đổi kho thì bỏ luôn khu đang chọn và dữ liệu của kho cũ,
        // mỗi kho có sơ đồ riêng nên không được để sót dữ liệu kho trước.
        setSelectedZone(null);
        setActiveLocation(null);
        setLocations([]);
        setZones([]);
        if (selectedWarehouseId !== null) {
            void loadLocations(selectedWarehouseId);
        }
    }, [selectedWarehouseId]);

    // Hàng đợi các thao tác ghi. Trước đây dùng `if (isSaving) return` nên thao tác thứ hai
    // gửi lúc thao tác thứ nhất chưa xong sẽ bị bỏ qua im lặng — kéo thả nhanh trên mặt bằng
    // là mất cú thả mà không báo gì. Giờ xếp hàng chạy tuần tự, không bỏ cú nào.
    const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());
    const pendingMutations = useRef(0);
    // Thao tác trong hàng đợi chạy sau, nên phải đọc kho đang chọn ở thời điểm chạy
    // chứ không phải thời điểm xếp hàng: người dùng có thể đã đổi kho ở giữa.
    const warehouseIdRef = useRef<number | null>(selectedWarehouseId);

    useEffect(() => {
        warehouseIdRef.current = selectedWarehouseId;
    }, [selectedWarehouseId]);

    const runMutation = (operation: () => Promise<void>, fallback: string): Promise<void> => {
        pendingMutations.current += 1;
        setIsSaving(true);

        const task = mutationQueue.current.then(async () => {
            setError(null);
            try {
                await operation();
                await loadLocations(warehouseIdRef.current);
            } catch (err) {
                // Không dùng window.alert: nó chặn luồng nên các thao tác còn lại trong hàng đợi
                // phải chờ người dùng bấm OK, và nhiều thao tác cùng lỗi sẽ bung một loạt hộp thoại.
                // Lỗi đã hiện ở banner đầu trang LocationsPage.
                console.error(fallback, err);
                setError(getHttpErrorMessage(err, fallback));
            } finally {
                pendingMutations.current -= 1;
                // Chỉ tắt cờ khi hàng đợi đã cạn, không tắt sớm giữa chừng.
                if (pendingMutations.current === 0) setIsSaving(false);
            }
        });

        // Nuốt lỗi ở mắt xích hàng đợi để một thao tác hỏng không chặn các thao tác sau.
        mutationQueue.current = task.catch(() => undefined);
        return task;
    };

    const handleAddZone = async (
        code: string,
        name?: string,
        shelfCount = 4,
        layerCount = 4,
        options?: { gridRow?: number | null; gridCol?: number | null; openAfterCreate?: boolean },
    ) => {
        if (!selectedWarehouseId) {
            setError('Chưa chọn kho, không thêm được khu vực.');
            return;
        }
        await runMutation(async () => {
            await warehouseService.createZone({
                warehouseId: selectedWarehouseId,
                code,
                name,
                shelfCount,
                layerCount,
                gridRow: options?.gridRow ?? null,
                gridCol: options?.gridCol ?? null,
                gridSize: shelfCount,
            });
            if (options?.openAfterCreate !== false) setSelectedZone(code);
        }, 'Không thêm được khu vực kho.');
    };

    const handleSaveZoneLayout = async (
        zoneId: number,
        layout: { gridRow: number | null; gridCol: number | null; gridSize: number | null },
    ) => {
        await runMutation(
            () => warehouseService.updateZoneLayout(zoneId, layout),
            'Không lưu được vị trí khu trên mặt bằng.',
        );
    };

    const getLocationInfo = (shelfCode: string, layerCode: string) => {
        return locations.find((loc) => loc.KhuVuc === selectedZone && loc.Ke === shelfCode && loc.Tang === layerCode);
    };

    /** Mọi thao tác ghi đều phải biết đang ở kho nào, nếu không sẽ ghi nhầm sang kho khác. */
    const requireWarehouse = (): number | null => {
        if (!selectedWarehouseId) {
            setError('Chưa chọn kho, không thực hiện được thao tác này.');
            return null;
        }
        return selectedWarehouseId;
    };

    const handleAddShelf = async () => {
        if (!selectedZone) return;
        const warehouseId = requireWarehouse();
        if (!warehouseId) return;

        await runMutation(async () => {
            const nextCodeInt = shelves.length > 0
                ? Math.max(...shelves.map(shelf => parseInt(shelf.code, 10) || 0)) + 1
                : 1;
            const shelfCode = nextCodeInt.toString().padStart(2, '0');

            await warehouseService.createShelf({
                zoneCode: selectedZone,
                warehouseId,
                code: shelfCode,
                name: `Kệ ${shelfCode}`,
                layerCount: Math.max(layers.length, 1),
            });
        }, 'Không thêm được kệ. Kiểm tra khu vực có tồn tại trong kho đang chọn không.');
    };

    const handleAddLayer = async () => {
        if (!selectedZone) return;
        const warehouseId = requireWarehouse();
        if (!warehouseId) return;

        await runMutation(async () => {
            const nextCodeInt = layers.length > 0
                ? Math.max(...layers.map(layer => parseInt(layer.code, 10) || 0)) + 1
                : 1;

            // Khu chưa có kệ nào thì thêm tầng cũng không sinh ra vị trí nào,
            // nên phải tạo kệ đầu tiên kèm số tầng mong muốn.
            if (shelves.length === 0) {
                await warehouseService.createShelf({
                    zoneCode: selectedZone,
                    warehouseId,
                    code: '01',
                    name: 'Kệ 01',
                    layerCount: nextCodeInt,
                });
                return;
            }

            await warehouseService.createLayer({
                zoneCode: selectedZone,
                warehouseId,
                layerNo: nextCodeInt,
            });
        }, 'Không thêm được tầng. Kiểm tra khu vực và kệ trong kho đang chọn.');
    };

    const handleSyncMatrix = async () => {
        if (!selectedZone) return;
        const warehouseId = requireWarehouse();
        if (!warehouseId) return;

        await runMutation(async () => {
            await warehouseService.syncLocationMatrix({
                zoneCode: selectedZone,
                warehouseId,
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
        zones,
        isLoading,
        isSaving,
        error,
        activeLocation,
        setActiveLocation,
        getLocationInfo,
        handleAddZone,
        handleSaveZoneLayout,
        handleAddShelf,
        handleAddLayer,
        handleSyncMatrix,
        handleReorderShelves,
        handleDeleteShelf,
        handleDeleteLayer,
    };
}
