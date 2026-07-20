# Authorization Module

## Mục tiêu nghiệp vụ

Module `authorization` đọc role/permission để hệ thống biết quyền nào đang tồn tại. Nó đi cùng `auth` và middleware `requirePermission`.

## Đọc code theo thứ tự

1. `authorization.routes.ts`: endpoint list.
2. `authorization.validation.ts`: filter id/search.
3. `authorization.controller.ts`: parse query.
4. `authorization.service.ts`: service boundary.
5. `authorization.repository.ts`: query bảng `roles` hiện tại.
6. `auth.service.ts`: nơi gom permission của user khi login/verify.
7. `require-permission.middleware.ts`: nơi permission được kiểm tra.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/authorization` | Danh sách role/authorization data |

## Vai trò trong request protected

```text
user login
  -> auth service load role + permissions
  -> JWT chứa role/permissions
  -> verifyToken load active user
  -> req.user.permissions
  -> requirePermission('permission_code')
```

## Permission quan trọng

- `goods_receipts:confirm`, `goods_receipts:reverse`
- `goods_issues:confirm`, `goods_issues:reverse`
- `stock_transfers:confirm`, `stock_transfers:reverse`
- `stock_adjustments:approve`, `stock_adjustments:reject`, `stock_adjustments:cancel`
- `stock_counts:create`, `stock_counts:start`, `stock_counts:count`, `stock_counts:submit`, `stock_counts:approve`
- `alerts:generate`
- `notifications:generate`

## Khi thêm permission mới

1. Thêm permission vào SQL schema/seed.
2. Gán permission cho role phù hợp trong `role_permissions`.
3. Gắn `requirePermission('code')` ở route.
4. Cập nhật docs module và `backend/docs/overview.md`.
5. Test bằng user có/không có quyền.