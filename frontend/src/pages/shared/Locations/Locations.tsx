import DashboardLayout from "../../../layout/Dashboardlayout";
import { useWarehouse } from "../../../hooks/useWarehouse";
import ZoneSelector from "./components/ZoneSelector";
import StructureSidebar from "./components/StructureSidebar";
import WarehouseGrid from "./components/WarehouseGrid";
import LocationDetailSidebar from "./components/LocationDetailSidebar";
import WarehouseGridEditor from "./components/WarehouseGridEditor";

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
                    /* BƯỚC 1: BẢN ĐỒ TỔNG THỂ CÁC KHU VỰC KHO (GIAO DIỆN MẶC ĐỊNH) */
                    <WarehouseGridEditor
                        onSelectZone={setSelectedZone}
                        locations={locations}
                    />
                ) : (
                    /* BƯỚC 2: GIAO DIỆN CHI TIẾT CẤU TRÚC 3 CỘT (KHI ĐÃ CHỌN ZONE CỤ THỂ) */
                    <div className="flex flex-1 overflow-hidden">
                        {/* 2. LEFT SIDEBAR: Cấu hình nhanh */}
                        <StructureSidebar
                            selectedZone={selectedZone}
                            shelves={shelves}
                            layers={layers}
                            handleAddShelf={handleAddShelf}
                            handleAddLayer={handleAddLayer}
                            handleDeleteShelf={handleDeleteShelf}
                            handleDeleteLayer={handleDeleteLayer}
                        />

                        {/* 3. MAIN CONTENT: Bản đồ Ma trận 2D Grid */}
                        <WarehouseGrid
                            layers={layers}
                            shelves={shelves}
                            selectedZone={selectedZone}
                            activeLocation={activeLocation}
                            setActiveLocation={setActiveLocation}
                            getLocationInfo={getLocationInfo}
                        />

                        {/* 4. SIDEBAR CHI TIẾT */}
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