interface WarehouseGridMapProps {
    zones: ZoneConfig[];
    onZoneChange: (zones: ZoneConfig[]) => void;
    onSelectZone: (zoneCode: string) => void;
}

interface ZoneConfig {
    code: string;
    name: string;
    color: string;
    cells: { row: number; col: number }[]; // Các ô thuộc zone
}