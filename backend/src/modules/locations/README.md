# Locations Module

## Mục tiêu nghiệp vụ

Module `locations` mô tả layout kho vật lý để frontend vẽ sơ đồ và để các flow tồn kho biết hàng đang nằm ở đâu.

## Đọc code theo thứ tự

1. `locations.routes.ts`: endpoint thêm/xóa khu/kệ/tầng.
2. `locations.validation.ts`: schema tạo zone/shelf/location.
3. `locations.controller.ts`: parse input và gọi service.
4. `locations.service.ts`: boundary nghiệp vụ.
5. `locations.repository.ts`: SQL transaction tạo zone/shelf/location và soft delete.
6. `location.model.ts`: type input/result/query.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/locations` | List vị trí kèm warehouse/zone/shelf và current stock |
| POST | `/locations` | Tạo một location |
| POST | `/locations/zones` | Tạo zone + shelf mặc định + layer mặc định |
| POST | `/locations/shelves` | Tạo shelf + layer mặc định |
| DELETE | `/locations/shelf/:shelfId` | Soft delete location thuộc shelf |
| DELETE | `/locations/layer?shelfId=1&layerNo=2` | Soft delete một layer |

## Mô hình dữ liệu

```text
warehouses
  -> warehouse_zones
    -> warehouse_shelves
      -> warehouse_locations
        -> stock_locations
```

## Luồng tạo zone

```text
POST /locations/zones
  -> parseCreateZone
  -> createZone
  -> insertZone transaction
      -> tìm warehouse theo warehouseId hoặc warehouse đầu tiên
      -> insert warehouse_zones
      -> lặp shelfCount, insert warehouse_shelves
      -> lặp layerCount, insert warehouse_locations
  -> commit
```

## Luồng tạo shelf

```text
POST /locations/shelves
  -> parseCreateShelf
  -> createShelf
  -> insertShelf transaction
      -> tìm zone theo zoneCode
      -> tính mã kệ tiếp theo nếu FE không gửi code
      -> insert shelf
      -> sinh location theo layerCount
```

## Khi sửa module này

- Không hard delete location/kệ/khu đã có lịch sử tồn.
- Khi sinh code location, phải giữ format dễ đọc: `ZONE-SHELF-LAYER`, ví dụ `A-01-03`.
- Nếu thêm warehouse multi-tenant, mọi query location phải lọc theo warehouse/user permission.
- Nếu FE hiển thị sai sơ đồ, kiểm tra `GET /locations` trước rồi mới kiểm tra UI.