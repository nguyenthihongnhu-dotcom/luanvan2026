# Authorization Feature

## Muc tieu nghiep vu

Module `authorization` cho phep ADMIN xem va cau hinh quyen (permission) cho tung vai tro (role). Thay doi quyen co hieu luc ngay o lan dang nhap tiep theo cua nhan vien.

## Doc code theo thu tu

1. `services/authorizationService.ts`: goi GET /authorization, GET /authorization/permissions, PUT /authorization/roles/:id/permissions.
2. `pages/AuthorizationPage.tsx`: hien thi danh sach role, danh sach permission, tick/untick permission cho tung role.
   - `loadData()`: tai song song roles va permissions.
   - `handleSave()`: PUT /authorization/roles/:id/permissions voi danh sach permission ID moi.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET | `/authorization` | Danh sach role va permission hien tai | `authorization:read` |
| GET | `/authorization/permissions` | Tat ca permission trong he thong | `authorization:read` |
| PUT | `/authorization/roles/:id/permissions` | Cap nhat permission cho role | `authorization:update` |

## Luu y

- Thay doi quyen khong co hieu luc ngay cho token hien tai -- user can dang xuat/dang nhap lai.
- Chi ADMIN moi nen co quyen `authorization:update`.
- Khong nen xoa quyen cua ADMIN khoi role ADMIN.
