# Warehouses Module

## Mục tiêu nghiệp vụ

Module `warehouses` quản lý kho vật lý. Warehouse là root của toàn bộ cấu trúc lưu trữ:

```text
warehouses
  -> warehouse_zones
    -> warehouse_shelves
      -> warehouse_locations
        -> stock_locations
```

Không có warehouse thì không thể dựng sơ đồ kho, không thể tạo vị trí, và các phiếu nhập/xuất/chuyển kho không có điểm đến/điểm đi hợp lệ.

## Đọc code theo thứ tự

1. `warehouses.routes.ts`: khai báo endpoint và permission.
2. `warehouses.validation.ts`: schema Zod cho filter và form tạo/sửa kho.
3. `warehouses.controller.ts`: parse request, gọi service, trả `{ data }`.
4. `warehouses.service.ts`: rule nghiệp vụ mức kho.
5. `warehouses.repository.ts`: SQL thao tác bảng `warehouses`.
6. `locations` module: zone/kệ/vị trí chi tiết thuộc từng warehouse.

## Endpoints

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/warehouses` | Danh sách kho | Không trong scope demo |
| POST | `/warehouses` | Tạo kho | `warehouses:create` |
| PUT | `/warehouses/:id` | Cập nhật kho | `warehouses:update` |
| DELETE | `/warehouses/:id` | Ngưng hoạt động kho | `warehouses:delete` |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo warehouse id |
| `search` | string | Tìm theo mã hoặc tên kho |
| `status` | string | Lọc trạng thái kho |

## Payload tạo/sửa

Các field nghiệp vụ chính:

- `code`: mã kho, dùng làm định danh dễ đọc.
- `name`: tên kho.
- `addressLine`, `ward`, `district`, `province`: địa chỉ.
- `managerUserId`: nhân sự phụ trách kho nếu có.
- `status`: trạng thái vận hành.
- `description`: ghi chú.

## Rule quan trọng

- Xóa kho đang là soft delete/ngưng hoạt động, không hard delete dữ liệu.
- Không nên hard delete warehouse đã có zone, location, stock hoặc chứng từ vì sẽ mất trace nghiệp vụ.
- Nếu sau này phân quyền theo kho, luồng list/update phải lọc thêm theo `user_warehouses` và `req.user`.
- Các module chứng từ nên resolve warehouse rõ theo `id` hoặc `code`, tránh query mơ hồ khi cả hai cùng tồn tại.