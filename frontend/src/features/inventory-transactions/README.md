# Inventory Transactions Feature

## Route

`/inventory-transactions`

## Mục đích

Xem log biến động tồn kho toàn hệ thống sau nhập, xuất, chuyển, kiểm kê và điều chỉnh.

## Luồng code

- `pages/InventoryTransactionsPage.tsx`: list/filter và map loại giao dịch sang tiếng Việt.
- `services/inventoryTransactionService.ts`: gọi `GET /inventory-transactions`.

## Lưu ý

- Đây là log đọc-only; mutation tồn phát sinh từ các module nghiệp vụ core.
