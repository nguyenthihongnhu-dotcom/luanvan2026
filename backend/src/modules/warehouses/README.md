# Warehouses Module

## Mục tiêu nghiệp vụ

Module `warehouses` đọc danh sách kho. Warehouse là root của toàn bộ cấu trúc lưu trữ vật lý.

## Đọc code theo thứ tự

1. `warehouses.routes.ts`: endpoint list.
2. `warehouses.validation.ts`: query filters.
3. `warehouses.controller.ts`: parse query.
4. `warehouses.service.ts`: service boundary.
5. `warehouses.repository.ts`: query bảng `warehouses`.
6. `locations` module: phần chi tiết zone/kệ/vị trí.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/warehouses` | Danh sách kho |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo warehouse id |
| `search` | string | Tìm theo code |
| `status` | string | Lọc trạng thái kho |

## Dependency

```text
warehouses
  -> warehouse_zones
    -> warehouse_shelves
      -> warehouse_locations
        -> stock_locations
```

Không có warehouse thì không thể tạo layout kho đúng, không có location thì không thể đặt tồn.

## Khi mở rộng module này

- Nếu thêm CRUD kho, cần kiểm tra quyền admin/manager.
- Không hard delete kho đã có location, stock hoặc chứng từ.
- Nếu phân quyền theo kho, đọc thêm `user_warehouses` và lọc theo `req.user`.