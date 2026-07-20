# Staff Feature

## Mục tiêu

Feature `staff` hiển thị danh sách nhân viên/user từ backend auth module.

## Đọc code theo thứ tự

1. `pages/EmployeesPage.tsx`: table nhân viên.
2. `services/userService.ts`: gọi `/auth/users` và map role/status sang UI model.

## Backend API

| Action | API |
| --- | --- |
| List users | `GET /auth/users` |
| Register user | Backend có `POST /auth/register`, nhưng feature staff hiện chưa có UI tạo user riêng |

## Luồng list

```text
EmployeesPage
  -> userService.listUsers
  -> GET /auth/users
  -> map UserRow sang User
      role_code -> VaiTro tiếng Việt
      status ACTIVE -> HoatDong
      status khác -> TamKhoa
```

## Khi sửa feature này

- Nếu thêm tạo nhân viên, cân nhắc dùng `/auth/register` hoặc endpoint staff riêng tùy nghiệp vụ.
- Role/status backend là enum tiếng Anh, UI phải map sang tiếng Việt.
- Nếu thêm filter/search, ưu tiên backend query khi data lớn.