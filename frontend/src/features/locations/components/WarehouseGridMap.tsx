export interface WarehouseGridMapProps {
    zones: ZoneConfig[];
    onZoneChange: (zones: ZoneConfig[]) => void;
    onSelectZone: (zoneCode: string) => void;
}

export interface ZoneConfig {
    code: string;
    name: string;
    color: string;
    cells: { row: number; col: number }[];
}
