import type { ReactNode } from "react";

export interface ColumnProps<T = unknown> {
    key: keyof T | string;
    title: string;
    className?: string;
    render?: (value: unknown, record: T, index: number) => ReactNode;
}

export interface TableProps<T = unknown> {
    columns: ColumnProps<T>[];
    dataSource: T[];
    rowKey?: keyof T | ((record: T) => string | number);
    className?: string;
    isLoading?: boolean;
}
