import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type CatalogFilters = {
  id?: number;
  search?: string;
  status?: string;
};

export type CategoryInput = {
  code?: string;
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type ProductInput = {
  sku: string;
  name: string;
  category: string;
  minStock?: number;
  /** Sản phẩm phải khai lô khi nhập kho (mặc định bật cho hàng Mẹ & Bé). */
  requiresLotTracking?: boolean;
  /** Sản phẩm phải khai hạn sử dụng khi nhập kho (sữa, bột, thực phẩm). */
  requiresExpiryTracking?: boolean;
};

export type CatalogRow = RowDataPacket & Record<string, unknown>;
export type MutationResult = { affectedRows: number };
