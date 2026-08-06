import type { RowDataPacket } from 'mysql2';

export type QueryParams = Record<string, string | number | null>;

export type BatchesFilters = {
  id?: number;
  search?: string;
  status?: string;
  /** Lọc theo SKU, dùng để kiểm tra trùng số lô cho đúng phạm vi một sản phẩm. */
  productVariantId?: number;
};

export type UpdateBatchInput = {
  id: number;
  supplierId?: number | null;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  /** Chỉ nhận hai giá trị người dùng tự đặt; ACTIVE/NEAR_EXPIRY/EXPIRED do hạn dùng quyết định. */
  status?: 'ACTIVE' | 'BLOCKED';
};

export type CreateBatchInput = {
  productVariantId: number;
  supplierId?: number | null;
  lotNumber: string;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
};

export type BatchesRow = RowDataPacket & Record<string, unknown>;
