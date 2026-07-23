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

    return (
        <div className={`w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs ${className}`}>
            <table className="w-full border-collapse bg-white text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider uppercase text-slate-500">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={String(col.key) + index}
                                scope="col"
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
                            <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-pink-600 border-t-transparent"></div>
                                    <span className="text-sm font-medium text-slate-500">Đang tải dữ liệu kho...</span>
                                </div>
                            </td>
                        </tr>
                    ) : dataSource.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center space-y-1">
                                    <span className="text-base font-semibold text-slate-500">Không có dữ liệu</span>
                                    <span className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc thêm bản ghi mới</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        dataSource.map((record, rowIndex) => (
                            <tr
                                key={getRowKey(record, rowIndex)}
                                className="table-row-hover transition-colors"
                            >
                                {columns.map((col, colIndex) => {
                                    const cellValue = record[col.key as keyof T];

                                    return (
                                        <td
                                            key={String(col.key) + colIndex}
                                            className={`px-5 py-3.5 whitespace-nowrap text-slate-700 ${col.className || ""}`}
                                        >
                                            {col.render
                                                ? col.render(cellValue, record, rowIndex)
                                                : (cellValue as React.ReactNode)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}