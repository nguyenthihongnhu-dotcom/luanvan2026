# Frontend Docs - Bambi WMS

Đây là điểm vào tài liệu frontend.

## Nên đọc theo thứ tự

1. [Intern Code Guide](intern-code-guide.md): cách đọc một màn hình, layer nào làm gì, cách debug API và text tiếng Việt.
2. [Overview](overview.md): kiến trúc frontend, route map, API map và thứ tự phụ thuộc feature.
3. `src/app/README.md`: app bootstrap, providers, router.
4. `src/shared/README.md`: httpClient, env, formatter, table.
5. `src/layouts/dashboard/README.md`: dashboard shell, navbar, sidebar.
6. README trong feature đang sửa: `src/features/<feature>/README.md`.

## Thứ tự feature để hiểu nhanh

```text
app/shared
  -> auth
  -> dashboard layout
  -> products/categories
  -> locations
  -> partners/staff
  -> transactions
```

Vì sao:

- `app/shared` là nền route/provider/API.
- `auth` quyết định token và user state.
- `dashboard layout` là shell chung của mọi màn quản trị.
- `products/categories`, `locations`, `partners/staff` là dữ liệu nền.
- `transactions` là màn tổng hợp nhiều backend document API.

## Feature docs

- [Auth](../src/features/auth/README.md)
- [Products](../src/features/products/README.md)
- [Locations](../src/features/locations/README.md)
- [Transactions](../src/features/transactions/README.md)
- [Partners](../src/features/partners/README.md)
- [Staff](../src/features/staff/README.md)

## Foundation docs

- [App layer](../src/app/README.md)
- [Shared layer](../src/shared/README.md)
- [Dashboard layout](../src/layouts/dashboard/README.md)

## Khi cập nhật docs

- Đổi route/API map: cập nhật `overview.md`.
- Đổi cách đọc/debug chung: cập nhật `intern-code-guide.md`.
- Đổi flow của màn nào: cập nhật `src/features/<feature>/README.md`.
- Đổi shared http/client/table/layout: cập nhật README tương ứng trong `src/shared`, `src/app`, hoặc `src/layouts/dashboard`.