import type { ReactNode } from "react";
import type { TableProps } from "./types";

export default function Tablelayout<T>({
    columns,
    dataSource,
    rowKey,
    isLoading = false,
    className = "",
}: TableProps<T>) {
    const getRowKey = (record: T, index: number): string | number => {
        if (!rowKey) return index;
        if (typeof rowKey === "function") return rowKey(record);
        return record[rowKey] as unknown as string | number;
    };

    const renderCell = (record: T, column: TableProps<T>["columns"][number], rowIndex: number): ReactNode => {
        const cellValue = record[column.key as keyof T];
        return column.render ? column.render(cellValue, record, rowIndex) : (cellValue as ReactNode);
    };

    const loadingState = (
        <div className="flex items-center justify-center gap-2 px-6 py-12 text-center text-sm font-medium text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
            <span>Đang tải dữ liệu kho...</span>
        </div>
    );

    const emptyState = (
        <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
            <span className="text-base font-semibold text-slate-500">Không có dữ liệu</span>
            <span className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc thêm bản ghi mới</span>
        </div>
    );

    return (
        <div className={`w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs ${className}`}>
            <div className="md:hidden">
                {isLoading ? loadingState : dataSource.length === 0 ? emptyState : (
                    <div className="divide-y divide-slate-100">
                        {dataSource.map((record, rowIndex) => (
                            <article key={getRowKey(record, rowIndex)} className="space-y-3 p-4">
                                {columns.map((column, colIndex) => (
                                    <div key={String(column.key) + colIndex} className="grid grid-cols-[minmax(96px,38%)_minmax(0,1fr)] gap-3 text-sm">
                                        <dt className="break-words text-xs font-bold uppercase tracking-wide text-slate-400">{column.title}</dt>
                                        <dd className={`min-w-0 break-words text-right text-slate-700 ${column.className || ""}`}>
                                            {renderCell(record, column, rowIndex)}
                                        </dd>
                                    </div>
                                ))}
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse bg-white text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider uppercase text-slate-500">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={String(col.key) + index}
                                    scope="col"
                                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                                    className={`px-5 py-3.5 ${col.className || ""}`}
                                >
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length}>{loadingState}</td>
                            </tr>
                        ) : dataSource.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>{emptyState}</td>
                            </tr>
                        ) : (
                            dataSource.map((record, rowIndex) => (
                                <tr
                                    key={getRowKey(record, rowIndex)}
                                    className="table-row-hover transition-colors"
                                >
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={String(col.key) + colIndex}
                                            style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                                            className={`px-5 py-3.5 whitespace-nowrap text-slate-700 ${col.className || ""}`}
                                        >
                                            {renderCell(record, col, rowIndex)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}