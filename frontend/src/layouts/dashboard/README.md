# Dashboard Layout

## Mục tiêu

`layouts/dashboard` chứa shell dùng chung cho các màn sau đăng nhập: sidebar, navbar và vùng nội dung.

## Files

- `DashboardLayout.tsx`: wrapper layout chính.
- `Navbar.tsx`: menu top điều hướng các màn.
- `Sidebar.tsx`: bộ lọc/nội dung sidebar động và user area.

## Luồng sử dụng

```text
FeaturePage
  -> <DashboardLayout>
      -> Navbar
      -> Sidebar
      -> page content
```

Feature page có thể dùng `useSidebar()` để set filter/sidebar content riêng.

## Khi sửa layout

- Không đặt business logic feature vào layout.
- Navbar chỉ giữ navigation, không gọi API.
- Sidebar chỉ render content được page set qua provider.
- Nếu thêm route mới, cập nhật Navbar và docs route map.