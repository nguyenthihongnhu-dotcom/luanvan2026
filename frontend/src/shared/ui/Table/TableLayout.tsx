import type { TableProps } from "./types";

export default function Tablelayout<T>({
    columns,
    dataSource,
    rowKey,
    isLoading = false,
    className = "",
}: TableProps<T>) {

    // Hàm lấy ra key cho từng dòng (row) dữ liệu dựa trên thuộc tính rowKey truyền vào
    const getRowKey = (record: T, index: number): string | number => {
        if (!rowKey) return index;
        if (typeof rowKey === "function") return rowKey(record);
        return record[rowKey] as unknown as string | number;
    };

    return (
        <div className={`w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm ${className}`}>
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">

                {/* Tiêu đề bảng (Header) */}
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={String(col.key) + index}
                                scope="col"
                                className={`px-6 py-4 font-semibold ${col.className || ""}`}
                            >
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Nội dung bảng (Body) */}
                <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                    {isLoading ? (
                        // Trạng thái đang tải dữ liệu (Loading)
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                    <span>Đang tải dữ liệu kho...</span>
                                </div>
                            </td>
                        </tr>
                    ) : dataSource.length === 0 ? (
                        // Trạng thái không có dữ liệu (Empty)
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400">
                                Không có dữ liệu hiển thị
                            </td>
                        </tr>
                    ) : (
                        // Hiển thị danh sách dữ liệu thực tế
                        dataSource.map((record, rowIndex) => (
                            <tr
                                key={getRowKey(record, rowIndex)}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                {columns.map((col, colIndex) => {
                                    // Lấy giá trị thô từ object tương ứng với key của cột
                                    const cellValue = record[col.key as keyof T];

                                    return (
                                        <td
                                            key={String(col.key) + colIndex}
                                            className={`px-6 py-4 whitespace-nowrap text-gray-600 ${col.className || ""}`}
                                        >
                                            {/* Nếu cột có cấu hình hàm render custom thì chạy hàm render, ngược lại hiển thị text thô */}
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