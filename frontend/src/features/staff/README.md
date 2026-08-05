# Staff & User Management Feature

## Muc tieu nghiep vu

Module `staff` quan ly danh sach tai khoan nhan vien trong he thong, phan vai tro (ADMIN, WAREHOUSE_MANAGER, STAFF, AUDITOR) va trang thai hoat dong.

## Doc code theo thu tu

1. `services/userService.ts`: quan ly CRUD nguoi dung qua API `/auth/users`.
2. `pages/EmployeesPage.tsx`: bang danh sach nhan vien, filter vai tro, modal tao/sua/xoa nhan vien.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET | `/auth/users` | Danh sach nhan vien | `users:read` |
| POST | `/auth/users` | Tao nhan vien moi | `users:create` |
| PUT | `/auth/users/:id` | Cap nhat thong tin & vai tro | `users:update` |
| DELETE | `/auth/users/:id` | Xoa/Khoa tai khoan | `users:delete` |

## Luu y

- Tai khoan duoc tao tu day co the chi dinh vai tro (ADMIN, MANAGER...), khac voi dang ky cong khai o man Login luon mac dinh la STAFF.
