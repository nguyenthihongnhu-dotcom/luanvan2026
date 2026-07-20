# Partners Feature

## Mục tiêu

Feature `partners` quản lý Đối tác/Nhà cung cấp. Hiện frontend map đối tác sang supplier backend.

## Đọc code theo thứ tự

1. `pages/PartnersPage.tsx`: page list, filter, modal thêm, xóa.
2. `services/partnerService.ts`: map supplier backend sang Partner UI model.

## Backend API

| Action | API |
| --- | --- |
| List | `GET /suppliers` |
| Create | `POST /suppliers` |
| Update | `PUT /suppliers/:id` |
| Delete | `DELETE /suppliers/:id` |

## Luồng list

```text
PartnersPage
  -> partnerService.listPartners
  -> GET /suppliers
  -> map SupplierRow
      id -> MaNCC
      name -> TenNCC
      contact_name -> NguoiLienHe
      phone/email -> SoDienThoai/Email
      type -> NCC
```

## Lưu ý hiện tại

- UI có filter `NCC/KH`, nhưng backend hiện là suppliers nên data trả về đang là `NCC`.
- Nếu muốn khách hàng thật, nên thêm backend module/API riêng thay vì nhét vào suppliers.

## Khi sửa feature này

- Không dùng `window.prompt`; dùng form/modal có validation.
- Sau create/delete/update phải reload list từ backend.
- Nếu thêm sửa partner, dùng sẵn `partnerService.updatePartner`.