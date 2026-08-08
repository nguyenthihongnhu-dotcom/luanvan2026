# Locations Module

## Mục tiêu nghiệp vụ

Module `locations` mô tả layout kho vật lý để frontend vẽ sơ đồ và để các flow tồn kho biết hàng đang nằm ở đâu.

## Đọc code theo thứ tự

1. `locations.routes.ts`: endpoint thêm/xóa khu/kệ/tầng và reorder kệ.
2. `locations.validation.ts`: schema tạo zone/shelf/location và reorder.
3. `locations.controller.ts`: parse input và gọi service.
4. `locations.service.ts`: boundary nghiệp vụ, chặn xóa kệ/tầng khi còn tồn.
5. `locations.repository.ts`: SQL transaction tạo zone/shelf/location, kiểm tra tồn và soft delete.
6. `location.model.ts`: type input/result/query.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/locations` | List vị trí kèm warehouse/zone/shelf, current stock và sản phẩm đang chứa |
| GET | `/locations/:id/history` | Lịch sử giao dịch tồn theo vị trí |
| POST | `/locations` | Tạo một location |
| POST | `/locations/zones` | Tạo zone + shelf mặc định + layer mặc định |
| POST | `/locations/shelves` | Tạo shelf + layer mặc định |
| POST | `/locations/layers` | Tạo tầng mới cho toàn khu và lấp các ô kệ/tầng còn thiếu |
| POST | `/locations/sync-matrix` | Lấp lại các ô kệ/tầng còn thiếu trong khu hiện tại |
| PATCH | `/locations/shelves/reorder` | Cập nhật thứ tự hiển thị các kệ |
| PATCH | `/locations/zones/:id` | Đổi biệt danh của khu (chỉ cột `name`, mã khu giữ nguyên) |
| DELETE | `/locations/zones/:id` | Soft delete cả khu (ô, kệ, khu) nếu trong khu không còn hàng |
| DELETE | `/locations/shelf/:shelfId` | Soft delete các location thuộc shelf nếu không còn hàng |
| DELETE | `/locations/layer?shelfId=1&layerNo=2` | Soft delete một layer nếu không còn hàng |

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
      -> tính mã kệ tiếp theo nếu frontend không gửi code
      -> insert shelf
      -> ensure ma trận location đủ đến layerCount hoặc số tầng hiện có của khu
      -> tự lấp các ô kệ/tầng còn thiếu trong khu
```

## Luồng tạo tầng

```text
POST /locations/layers
  -> parseCreateLayer
  -> createLayer
  -> insertLayer transaction
      -> tìm zone theo zoneCode
      -> nếu không gửi layerNo thì lấy tầng lớn nhất hiện có + 1
      -> ensure ma trận location đủ từ tầng 1 đến tầng mới
      -> tự lấp các ô thiếu như A-A02-02 trước khi commit
```

## Luồng đồng bộ ma trận

```text
POST /locations/sync-matrix
  -> parseSyncLocationMatrix
  -> syncLocationMatrix
  -> syncLocationMatrixRepository transaction
      -> tìm zone theo zoneCode
      -> lấy tầng lớn nhất hiện có trong khu
      -> ensure mọi tổ hợp kệ x tầng đều có warehouse_locations active
      -> trả createdLocationCount
```

## Luồng xóa khu/kệ/tầng

```text
DELETE /locations/zones/:id
  -> mở transaction, khóa các ô còn hàng trong khu bằng FOR UPDATE
  -> nếu còn stock_locations.quantity > 0 hoặc reserved_quantity > 0: 409 ZONE_NOT_EMPTY
  -> soft delete warehouse_locations -> warehouse_shelves -> warehouse_zones
  (kiểm tra và xóa nằm chung transaction để không ai kịp nhập hàng vào giữa hai bước)

DELETE /locations/shelf/:shelfId
  -> countShelfLocationsWithStock
  -> nếu còn stock_locations.quantity > 0 hoặc reserved_quantity > 0: 409 LOCATION_HAS_STOCK
  -> soft delete warehouse_locations thuộc shelf

DELETE /locations/layer?shelfId=&layerNo=
  -> countLayerLocationsWithStock
  -> nếu còn stock_locations.quantity > 0 hoặc reserved_quantity > 0: 409 LOCATION_HAS_STOCK
  -> soft delete warehouse_locations thuộc layer
```

## Khi sửa module này

- Không hard delete location/kệ/khu đã có lịch sử tồn.
- Không cho xóa kệ/tầng nếu còn tồn thực tế hoặc tồn đã giữ chỗ.
- Khi sinh code location, phải giữ format `KHO-KHU-KE-TANG`, ví dụ `HCM01-A-01-03`. Thiếu tiền tố kho sẽ đụng mã vì cột `code` UNIQUE toàn bảng.
- Mã khu (`code`) là định danh kỹ thuật nằm trong mã ô, không đổi được; muốn gọi tên khác thì đặt biệt danh ở cột `name`.
- Khi thêm kệ hoặc tầng, backend phải đảm bảo ma trận `shelf x layer` không bị lỗ trống; không để frontend tự loop từng ô.
- Nếu thêm warehouse multi-tenant, mọi query location phải lọc theo warehouse/user permission.
- Nếu frontend hiển thị sai sơ đồ, kiểm tra `GET /locations` trước rồi mới kiểm tra UI.
