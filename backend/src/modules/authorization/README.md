# Authorization Module

## Mục tiêu nghiệp vụ

Module `authorization` quản lý dữ liệu phân quyền: role, permission và mapping role-permission. Nó đi cùng `auth` và middleware `requirePermission` để quyết định user có được thao tác endpoint nhạy cảm hay không.

## Đọc code theo thứ tự

1. `authorization.routes.ts`: endpoint list permission, list role và cập nhật permission cho role.
2. `authorization.validation.ts`: validate query/id/payload permission codes.
3. `authorization.controller.ts`: parse request, trả `{ data }`.
4. `authorization.service.ts`: rule cập nhật quyền role.
5. `authorization.repository.ts`: SQL trên `roles`, `permissions`, `role_permissions`.
6. `auth.service.ts`: load permissions khi login/verify token.
7. `require-permission.middleware.ts`: kiểm tra `req.user.permissions`.

## Endpoints

| Method | Path | Mô tả | Permission |
| --- | --- | --- | --- |
| GET | `/authorization` | Danh sách role kèm permissions | `authorization:read` |
| GET | `/authorization/permissions` | Danh sách tất cả permissions | `authorization:read` |
| PUT | `/authorization/roles/:id/permissions` | Cập nhật permissions của role | `authorization:update` |

## Payload cập nhật permission role

```json
{
  "permissionCodes": ["goods_receipts:confirm", "alerts:resolve"]
}
```

Service sẽ thay thế toàn bộ mapping cũ của role bằng danh sách permission code mới trong transaction.

## Vai trò trong request protected

```text
user login
  -> auth service load role + permissions
  -> JWT chứa role/permissions
  -> verifyToken gắn req.user
  -> requirePermission('permission_code')
  -> cho phép hoặc trả 403
```

## Permission quan trọng

- `authorization:read`, `authorization:update`
- `warehouses:create`, `warehouses:update`, `warehouses:delete`
- `goods_receipts:confirm`, `goods_receipts:reverse`
- `goods_issues:confirm`, `goods_issues:reverse`
- `stock_transfers:confirm`, `stock_transfers:reverse`
- `stock_adjustments:approve`, `stock_adjustments:reject`, `stock_adjustments:cancel`
- `stock_counts:create`, `stock_counts:start`, `stock_counts:count`, `stock_counts:submit`, `stock_counts:approve`
- `alerts:generate`, `alerts:read`, `alerts:resolve`
- `notifications:generate`, `notifications:read`
- `settings:update`

## Khi thêm permission mới

1. Thêm permission vào schema/seed SQL.
2. Gán permission cho role phù hợp trong `role_permissions`.
3. Gắn `requirePermission('code')` ở route cần bảo vệ.
4. Cập nhật README module liên quan và `backend/docs/overview.md`.
5. Test bằng user có quyền và user không có quyền.