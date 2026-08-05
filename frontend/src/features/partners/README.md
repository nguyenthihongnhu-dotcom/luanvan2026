# Partners Feature

## Muc tieu nghiep vu

Module `partners` quan ly danh sach nha cung cap (NCC) / doi tac. NCC duoc tham chieu khi tao phieu nhap hang. Day la master data quan trong de tao chung tu.

## Doc code theo thu tu

1. `services/partnerService.ts`: goi CRUD /suppliers; map SupplierRow sang Partner UI model.
2. `pages/PartnersPage.tsx`: trang chinh voi bang + modal them/sua.
   - `loadPartners()`: tai danh sach doi tac.
   - `openCreateModal()`: reset form, mo modal tao moi.
   - `openEditModal(partner)`: dien san form, mo modal sua.
   - `handleSubmit()`: tao moi hoac cap nhat doi tac.
   - `handleDelete(id)`: xoa doi tac sau xac nhan.
   - Sidebar: chon loc NCC / KH.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/suppliers` | Danh sach nha cung cap |
| POST | `/suppliers` | Tao nha cung cap moi |
| PUT | `/suppliers/:id` | Cap nhat thong tin |
| DELETE | `/suppliers/:id` | Xoa nha cung cap |

## Luu y

- Khong the xoa NCC dang duoc tham chieu boi phieu nhap hang (backend tra loi 409).
- Ma NCC (MaNCC) dung tra cuu nhanh khi tao phieu nhap.
- Type filter (NCC / KH) loc o frontend, khong gui len backend.
