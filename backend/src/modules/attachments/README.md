# Attachments Module

## Mục tiêu nghiệp vụ

Module `attachments` quản lý **metadata file đính kèm** cho chứng từ hoặc entity nghiệp vụ. Ở trạng thái hiện tại, module này chỉ đọc danh sách metadata từ bảng `attachments`; chưa xử lý upload/download file thật.

Ví dụ entity có thể gắn file sau này:

- Phiếu nhập kho.
- Phiếu xuất kho.
- Phiếu kiểm kê.
- Biên bản điều chỉnh tồn.
- Hình ảnh/chứng từ scan.

## Đọc code theo thứ tự

1. `attachments.routes.ts`: chỉ có endpoint list.
2. `attachments.validation.ts`: filter hợp lệ từ query string.
3. `attachments.controller.ts`: parse query và trả `{ data }`.
4. `attachments.service.ts`: service boundary, hiện gọi repository trực tiếp.
5. `attachments.repository.ts`: build SQL filter và query bảng `attachments`.
6. `attachments.model.ts`: type filter/row/query params.

## Base path

```http
/attachments
```

## Endpoint hiện có

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/attachments` | Danh sách metadata file đính kèm | Không trong scope demo |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo attachment id |
| `search` | string | Tìm theo `file_name` |

Ví dụ:

```http
GET /attachments?search=invoice
GET /attachments?id=1
```

## Luồng xử lý hiện tại

```text
GET /attachments
  -> attachments.routes.ts
  -> listAttachmentsController(req, res)
  -> parseAttachmentsFilters(req.query)
      -> id?: positive int
      -> search?: non-empty string max 191
  -> listAttachments(filters)
  -> findAttachments(filters)
      -> build where[]
      -> nếu id: id = :id
      -> nếu search: file_name LIKE :search
      -> SELECT * FROM attachments ... LIMIT 100
  -> res.json({ data: rows })
```

## Bảng dữ liệu chính

- `attachments`

Các cột cụ thể xem trong `warehouse_management_mysql.sql`. Về mặt nghiệp vụ, bảng này nên lưu metadata như:

- Entity/chứng từ được gắn file.
- Tên file hiển thị.
- MIME type.
- Kích thước.
- Storage key/path.
- Người upload.
- Thời điểm upload.

## Vì sao hiện chưa có upload thật?

Upload file cần thêm quyết định kiến trúc, không nên làm tạm trong repository:

- File lưu ở đâu: local disk, S3-compatible storage, database BLOB, hay dịch vụ khác.
- Có cần antivirus/content validation không.
- Có giới hạn dung lượng và loại file không.
- Quyền xem/tải file theo chứng từ hay theo warehouse.
- Có cần signed URL không.
- File xóa vật lý hay chỉ soft delete metadata.

Vì các quyết định này ảnh hưởng vận hành và bảo mật, module hiện chỉ giữ phần metadata/listing.

## Khi muốn thêm upload file thật

Thêm theo hướng này:

1. `attachments.model.ts`: thêm type `CreateAttachmentInput`, `AttachmentUploadResult`.
2. `attachments.validation.ts`: validate metadata như `entityType`, `entityId`, `fileName`, `mimeType`, `sizeBytes`.
3. Thêm middleware upload ở route, ví dụ dùng `multer` nếu chọn local upload.
4. Tạo service `createAttachment` để orchestrate:
   - validate entity tồn tại nếu cần.
   - kiểm tra quyền user.
   - gọi storage adapter lưu file.
   - gọi repository insert metadata.
5. Tạo abstraction storage, ví dụ `common/storage`, để sau này đổi local disk sang S3 không sửa controller.
6. Repository chỉ insert/update metadata, không xử lý binary stream.
7. Thêm endpoint download nếu cần, có kiểm tra quyền.
8. Cập nhật OpenAPI và README này.

## Những lỗi cần tránh

- Không lưu file binary lớn trực tiếp vào MySQL nếu chưa có yêu cầu rõ.
- Không để frontend gửi path tùy ý rồi backend đọc file theo path đó.
- Không expose local filesystem path trong response public.
- Không cho download attachment nếu chưa kiểm tra user có quyền với entity/chứng từ liên quan.
- Không xóa vật lý file ngay nếu vẫn cần audit/truy vết.

## Mức độ quan trọng trong hệ thống

Module này thuộc tầng Operations/Support. Nó không phải điều kiện bắt buộc để nhập/xuất/chuyển kho hoạt động, nhưng quan trọng nếu muốn lưu chứng từ scan, hóa đơn, biên bản kiểm kê hoặc ảnh minh chứng.
## Khi sửa module này

- Nếu chỉ đổi filter list, sửa `attachments.validation.ts` và `attachments.repository.ts`.
- Nếu thêm upload/download, phải thiết kế storage adapter trước, không viết stream/file system trực tiếp trong controller.
- Nếu attachment gắn với chứng từ, cần kiểm tra entity tồn tại và quyền user với entity đó.
- Nếu thêm soft delete, giữ metadata để audit và không xóa vật lý file khi chưa có policy rõ.