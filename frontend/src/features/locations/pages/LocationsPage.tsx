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
                />

                {!selectedZone ? (
                    /* BÆ¯á»šC 1: Báº¢N Äá»’ Tá»”NG THá»‚ CÃC KHU Vá»°C KHO (GIAO DIá»†N Máº¶C Äá»ŠNH) */
                    <WarehouseGridEditor
                        onSelectZone={setSelectedZone}
                        locations={locations}
                    />
                ) : (
                    /* BÆ¯á»šC 2: GIAO DIá»†N CHI TIáº¾T Cáº¤U TRÃšC 3 Cá»˜T (KHI ÄÃƒ CHá»ŒN ZONE Cá»¤ THá»‚) */
                    <div className="flex flex-1 overflow-hidden">
                        {/* 2. LEFT SIDEBAR: Cáº¥u hÃ¬nh nhanh */}
                        <StructureSidebar
                            selectedZone={selectedZone}
                            shelves={shelves}
                            layers={layers}
                            handleAddShelf={handleAddShelf}
                            handleAddLayer={handleAddLayer}
                            handleDeleteShelf={handleDeleteShelf}
                            handleDeleteLayer={handleDeleteLayer}
                        />

                        {/* 3. MAIN CONTENT: Báº£n Ä‘á»“ Ma tráº­n 2D Grid */}
                        <WarehouseGrid
                            layers={layers}
                            shelves={shelves}
                            selectedZone={selectedZone}
                            activeLocation={activeLocation}
                            setActiveLocation={setActiveLocation}
                            getLocationInfo={getLocationInfo}
                        />

                        {/* 4. SIDEBAR CHI TIáº¾T */}
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
