import { ReactNode } from "react";

// Thêm Generic <T = any> giúp tái sử dụng cấu trúc cho mọi loại bảng dữ liệu
export interface ColumnProps<T = any> {
    key: keyof T | string; // Chấp nhận cả thuộc tính của T hoặc một string bất kỳ (như "actions")
    title: string;
    className?: string;
    // Cho phép render nhận value (bất kỳ kiểu gì) và record thuộc kiểu đối tượng T
    render?: (value: any, record: T, index: number) => ReactNode;
}

export interface TableProps<T = any> {
    columns: ColumnProps<T>[]; // Truyền T vào để ColumnProps bắt đúng kiểu dữ liệu của bảng đó
    dataSource: T[];           // Mảng dữ liệu đầu vào (ví dụ: ProductItem[])
    rowKey?: keyof T | ((record: T) => string | number); // Khóa phân biệt giữa các dòng
    className?: string;
    isLoading?: boolean;
}