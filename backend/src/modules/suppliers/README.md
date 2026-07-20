# Suppliers Module

## Mục tiêu nghiệp vụ

Module `suppliers` quản lý nhà cung cấp/đối tác cung ứng. Frontend trang Đối tác gọi module này thay cho data cứng.

## Đọc code theo thứ tự

1. `suppliers.routes.ts`: CRUD endpoint.
2. `suppliers.validation.ts`: input tạo/sửa và parse id/filter.
3. `suppliers.controller.ts`: map request sang service.
4. `suppliers.service.ts`: service boundary, return type rõ `Promise`.
5. `suppliers.repository.ts`: SQL list/insert/update/soft delete.
6. `suppliers.model.ts`: type `SupplierInput`, `SuppliersRow`, `MutationResult`.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/suppliers` | Danh sách nhà cung cấp, hỗ trợ filter/search |
| POST | `/suppliers` | Tạo nhà cung cấp |
| PUT | `/suppliers/:id` | Cập nhật nhà cung cấp |
| DELETE | `/suppliers/:id` | Soft delete nhà cung cấp |

## Luồng tạo nhà cung cấp

```text
POST /suppliers
  -> parseSupplierInput(body)
  -> createSupplier(input)
  -> insertSupplier(input)
      -> tự sinh code nếu FE không gửi
      -> insert suppliers
  -> trả { id }
```

## Luồng xóa

```text
DELETE /suppliers/:id
  -> parseSupplierId(params.id)
  -> deleteSupplier(id)
  -> softDeleteSupplier(id)
      -> set deleted_at
      -> set status INACTIVE
```

## Khi sửa module này

- Không hard delete supplier nếu đã dùng trong phiếu nhập.
- Giữ type service là `Promise<...>` vì repository async.
- Nếu thêm customer/partner nhiều loại, cân nhắc module riêng thay vì làm `suppliers` thành god module.
- Nếu FE cần sửa đối tác, thêm form FE gọi `PUT /suppliers/:id`, không sửa local state giả.