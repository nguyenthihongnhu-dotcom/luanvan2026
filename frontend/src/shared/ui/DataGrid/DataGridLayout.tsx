import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
    AllCommunityModule,
    ModuleRegistry,
    themeQuartz,
    type ColDef,
    type GridOptions,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

interface DataGridLayoutProps<T extends object> {
    columns: ColDef<T>[];
    rows: T[];
    isLoading?: boolean;
    getRowId?: GridOptions<T>["getRowId"];
    height?: number;
    pageSize?: number;
}

const warehouseTheme = themeQuartz.withParams({
    accentColor: "#db2777",
    borderColor: "#e2e8f0",
    browserColorScheme: "light",
    cellHorizontalPaddingScale: 1,
    columnBorder: false,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontSize: 13,
    headerBackgroundColor: "#f8fafc",
    headerFontSize: 11,
    headerFontWeight: 700,
    headerTextColor: "#64748b",
    oddRowBackgroundColor: "#ffffff",
    rowBorder: true,
    rowHoverColor: "#f8fafc",
    spacing: 8,
});

export default function DataGridLayout<T extends object>({
    columns,
    rows,
    isLoading = false,
    getRowId,
    height = 520,
    pageSize = 25,
}: DataGridLayoutProps<T>) {
    const defaultColDef = useMemo<ColDef<T>>(
        () => ({
            filter: true,
            minWidth: 120,
            resizable: true,
            sortable: true,
        }),
        [],
    );

    return (
        <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
            <div style={{ height, width: "100%" }}>
                <AgGridReact<T>
                    columnDefs={columns}
                    defaultColDef={defaultColDef}
                    getRowId={getRowId}
                    loading={isLoading}
                    pagination
                    paginationPageSize={pageSize}
                    paginationPageSizeSelector={[10, 25, 50, 100]}
                    rowData={rows}
                    suppressCellFocus
                    theme={warehouseTheme}
                />
            </div>
        </div>
    );
}
