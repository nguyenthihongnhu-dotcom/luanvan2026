import { z } from 'zod';

/**
 * Thời điểm do client gửi lên cho các cột DATETIME(3) (received_at, issued_at...).
 *
 * Cột trong MySQL không lưu múi giờ, nên chỉ nhận chuỗi giờ địa phương dạng
 * `YYYY-MM-DD HH:mm[:ss]` (cho phép cả ký tự `T` của input HTML) và ghi thẳng
 * xuống DB. Không dùng `z.coerce.date()`: chuỗi ISO có `Z` sẽ bị driver quy đổi
 * theo múi giờ của tiến trình Node, làm ngày chứng từ lệch so với ngày người
 * dùng chọn trên form.
 */
export const localDateTimeSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/,
    'Thời điểm phải có dạng YYYY-MM-DD HH:mm:ss',
  )
  .transform((value) => {
    const normalized = value.replace('T', ' ');
    return normalized.length === 16 ? `${normalized}:00` : normalized;
  });
