# Warehouses Feature

## Route

`/warehouses`

## Mục đích

Quản lý kho master dùng bởi sơ đồ kho, tồn kho, chứng từ nhập/xuất/chuyển và kiểm kê.

## Luồng code

- `pages/WarehousesPage.tsx`: list/filter, modal thêm/sửa, xoá mềm.
- `services/warehouseService.ts`: gọi `/warehouses`, `POST /warehouses`, `PUT /warehouses/:id`, `DELETE /warehouses/:id`.

## Lưu ý

- Delete là xoá mềm ở backend để không phá dữ liệu vị trí/tồn đang tham chiếu warehouse.
- Các dropdown kho trong feature khác dùng chung `warehouseService.listWarehouses()`.
