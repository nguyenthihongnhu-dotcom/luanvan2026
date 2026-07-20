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
        activeLocation,
        setActiveLocation,
        getLocationInfo,
        handleAddZone,
        handleAddShelf,
        handleAddLayer,
        handleDeleteShelf,
        handleDeleteLayer,
    } = useWarehouse();

    return (
        <DashboardLayout>
            <div className="flex flex-col bg-gray-50 text-gray-800 rounded-xl overflow-hidden border border-gray-200">
                {/* 1. TOP BAR */}
                <ZoneSelector
                    selectedZone={selectedZone}
                    setSelectedZone={setSelectedZone}
                    onAddZone={handleAddZone}
                />

                {!selectedZone ? (
                    /* Overall warehouse map */
                    <WarehouseGridEditor
                        onSelectZone={setSelectedZone}
                        locations={locations}
                    />
                ) : (
                    /* Zone detail view */
                    <div className="flex flex-1 overflow-hidden">
                        {/* Structure controls */}
                        <StructureSidebar
                            selectedZone={selectedZone}
                            shelves={shelves}
                            layers={layers}
                            handleAddShelf={handleAddShelf}
                            handleAddLayer={handleAddLayer}
                            handleDeleteShelf={handleDeleteShelf}
                            handleDeleteLayer={handleDeleteLayer}
                        />

                        {/* Rack and layer grid */}
                        <WarehouseGrid
                            layers={layers}
                            shelves={shelves}
                            selectedZone={selectedZone}
                            activeLocation={activeLocation}
                            setActiveLocation={setActiveLocation}
                            getLocationInfo={getLocationInfo}
                        />

                        {/* Location detail */}
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
