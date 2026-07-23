import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import { useWarehouse } from "@/features/locations/hooks/useWarehouse";
import ZoneSelector from "@/features/locations/components/ZoneSelector";
import StructureSidebar from "@/features/locations/components/StructureSidebar";
import WarehouseGrid from "@/features/locations/components/WarehouseGrid";
import LocationDetailSidebar from "@/features/locations/components/LocationDetailSidebar";
import WarehouseGridEditor from "@/features/locations/components/WarehouseGridEditor";

export default function WarehouseMapping() {
    const {
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
        handleReorderShelves,
        handleDeleteShelf,
        handleDeleteLayer,
    } = useWarehouse();

    return (
        <DashboardLayout>
            <div className="flex flex-col bg-gray-50 text-gray-800 rounded-xl overflow-hidden border border-gray-200">
                {error && <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                {isLoading && <div className="border-b border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">Đang tải sơ đồ kho...</div>}

                <ZoneSelector
                    selectedZone={selectedZone}
                    setSelectedZone={setSelectedZone}
                    onAddZone={handleAddZone}
                />

                {!selectedZone ? (
                    <WarehouseGridEditor
                        onSelectZone={setSelectedZone}
                        locations={locations}
                    />
                ) : (
                    <div className="flex flex-1 overflow-hidden">
                        <StructureSidebar
                            selectedZone={selectedZone}
                            shelves={shelves}
                            layers={layers}
                            isSaving={isSaving}
                            handleAddShelf={handleAddShelf}
                            handleAddLayer={handleAddLayer}
                            handleDeleteShelf={handleDeleteShelf}
                            handleDeleteLayer={handleDeleteLayer}
                        />

                        <WarehouseGrid
                            layers={layers}
                            shelves={shelves}
                            selectedZone={selectedZone}
                            activeLocation={activeLocation}
                            setActiveLocation={setActiveLocation}
                            getLocationInfo={getLocationInfo}
                            onReorderShelves={handleReorderShelves}
                        />

                        {activeLocation && (
                            <LocationDetailSidebar
                                activeLocation={activeLocation}
                                setActiveLocation={setActiveLocation}
                                selectedZone={selectedZone}
                            />
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}