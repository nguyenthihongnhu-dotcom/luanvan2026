import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useWarehouse } from "@/features/locations/hooks/useWarehouse";
import ZoneSelector from "@/features/locations/components/ZoneSelector";
import StructureSidebar from "@/features/locations/components/StructureSidebar";
import WarehouseGrid from "@/features/locations/components/WarehouseGrid";
import LocationDetailSidebar from "@/features/locations/components/LocationDetailSidebar";
import WarehouseGridEditor from "@/features/locations/components/WarehouseGridEditor";

export default function WarehouseMapping() {
    const [isStructureSidebarOpen, setIsStructureSidebarOpen] = useState(true);
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
        handleSyncMatrix,
        handleReorderShelves,
        handleDeleteShelf,
        handleDeleteLayer,
    } = useWarehouse();
    const StructureSidebarToggleIcon = isStructureSidebarOpen ? MenuFoldOutlined : MenuUnfoldOutlined;

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
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
                            <div className="text-xs text-gray-500">
                                <span className="font-semibold text-gray-700">Khu {selectedZone}</span>
                                <span> - {isStructureSidebarOpen ? "Đang hiện sidebar cấu trúc" : "Đang ẩn sidebar cấu trúc"}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsStructureSidebarOpen((open) => !open)}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-pink-200 hover:text-pink-600"
                                aria-pressed={isStructureSidebarOpen}
                                title={isStructureSidebarOpen ? "Ẩn sidebar cấu trúc" : "Hiện sidebar cấu trúc"}
                            >
                                <StructureSidebarToggleIcon className="text-sm" />
                                <span>{isStructureSidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}</span>
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 overflow-hidden">
                            {isStructureSidebarOpen && (
                                <StructureSidebar
                                    selectedZone={selectedZone}
                                    shelves={shelves}
                                    layers={layers}
                                    isSaving={isSaving}
                                    handleAddShelf={handleAddShelf}
                                    handleAddLayer={handleAddLayer}
                                    handleSyncMatrix={handleSyncMatrix}
                                    handleDeleteShelf={handleDeleteShelf}
                                    handleDeleteLayer={handleDeleteLayer}
                                />
                            )}

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
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
