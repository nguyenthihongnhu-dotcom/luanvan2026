# App Layer

## Mục tiêu

`src/app` chứa phần bootstrap cấp ứng dụng: root component, providers và routing.

## Đọc code theo thứ tự

1. `../main.tsx`: render React app.
2. `App.tsx`: root app component.
3. `providers/AppProviders.tsx`: bọc provider theo thứ tự.
4. `router/AppRouter.tsx`: route map.
5. `providers/SidebarProvider.tsx`: dynamic sidebar content.

## Provider order

```text
AppProviders
  -> AuthProvider
  -> SidebarProvider
  -> BrowserRouter
  -> children
```

Auth phải bọc các component cần `useAuth`. Sidebar provider phải bọc dashboard/page cần `useSidebar`.

## Khi thêm route

1. Tạo page trong `features/<feature>/pages`.
2. Import page vào `router/AppRouter.tsx`.
3. Thêm `<Route />`.
4. Nếu route xuất hiện trong navbar, cập nhật `layouts/dashboard/Navbar.tsx`.
5. Cập nhật docs feature và `frontend/docs/overview.md` nếu route chính.