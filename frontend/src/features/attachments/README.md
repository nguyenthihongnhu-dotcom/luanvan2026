# Attachments Feature

## Route

`/attachments`

## Mục đích

Xem metadata file đính kèm của chứng từ hoặc entity nghiệp vụ.

## Luồng code

- `pages/AttachmentsPage.tsx`: bảng metadata file, link mở `file_url`.
- `services/attachmentService.ts`: gọi `GET /attachments`.

## Lưu ý

- Backend chưa có upload/download storage thật, nên frontend không dựng nút upload giả.
