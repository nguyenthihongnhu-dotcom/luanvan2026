# Locations Feature

## Mục tiêu

Feature `locations` hiển thị và chỉnh sơ đồ kho: khu, kệ, tầng/vị trí và trạng thái chứa hàng.

## Đọc code theo thứ tự

1. `pages/LocationsPage.tsx`: compose layout kho.
2. `hooks/useWarehouse.ts`: state locations, selected zone, add/delete handlers.
3. `services/warehouseService.ts`: gọi `/locations` và map backend location sang UI model.
4. `components/ZoneSelector.tsx`: chọn/tạo khu.
5. `components/WarehouseGrid*.tsx`: render sơ đồ kho.
6. `components/StructureSidebar.tsx`, `LocationDetailSidebar.tsx`: sidebar chi tiết/cấu trúc.

## Backend API

| UI action | API |
| --- | --- |
| Load sơ đồ kho | `GET /locations` |
| Tạo vị trí đơn | `POST /locations` |
| Tạo khu mới | `POST /locations/zones` |
| Tạo kệ mới | `POST /locations/shelves` |
| Xóa kệ | `DELETE /locations/shelf/:shelfId` |
| Xóa tầng | `DELETE /locations/layer?shelfId=&layerNo=` |

## Luồng load kho

```text
LocationsPage
  -> useWarehouse.loadLocations
  -> warehouseService.listWarehouseLocations
      -> GET /locations
      -> map BackendLocation sang ViTriKho
      -> quantity <= 0 => Trong
      -> status FULL => Day
      -> còn lại => DangChua
  -> deriveShelves / deriveLayers
  -> render grid
```

## Lưu ý tiếng Việt/UI

UI model vẫn dùng vài key Việt không dấu/có dấu kiểu cũ như `ViTriKho`, `TrangThai`, `KhuVuc`. Khi render ra màn hình, label phải là tiếng Việt sạch.

## Khi sửa feature này

- Không tự thêm zone/kệ chỉ bằng local state nếu backend đã có API.
- Sau mutation phải reload từ backend để đồng bộ id thật.
- Nếu thêm status location mới, cập nhật `toLocationStatus` và UI legend.
- Nếu layout sai, kiểm tra data `GET /locations` trước khi sửa CSS.