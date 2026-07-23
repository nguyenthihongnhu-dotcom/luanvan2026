# Stock Feature

## Mục đích

Feature `stock` là màn vận hành tồn kho. Màn này không dùng mock, toàn bộ dữ liệu lấy từ backend module `stock` và module `warehouses`.

## Route

```http
/stock
```

## Luồng chính

1. Load danh sách kho từ `GET /warehouses?status=ACTIVE`.
2. Load tồn hiện tại từ `GET /stock/current`, có thể lọc theo `warehouseId` và `productVariantId`.
3. Load lô gần hết hạn từ `GET /stock/near-expiry`, lọc theo `warehouseId`.
4. Preview phân bổ xuất kho bằng `GET /stock/allocation` với `warehouseId`, `productVariantId`, `quantity`, `strategy`.

## File quan trọng

- `services/stockService.ts`: định nghĩa type response và gom toàn bộ API call của feature.
- `pages/StockPage.tsx`: quản lý filter, gọi service, render bảng tồn kho/gần hết hạn/preview allocation.

## Lưu ý cho intern

- Không gọi `httpClient` trực tiếp trong component mới. Nếu cần API stock khác, thêm vào `stockService` trước.
- Backend trả enum/field kỹ thuật như `product_variant_id`, `stock_location_id`; UI chỉ render nhãn tiếng Việt và format số/ngày ở page.
- Preview allocation chỉ là xem trước. Việc xuất kho thật vẫn đi qua phiếu xuất ở feature `transactions` và backend confirm chứng từ.