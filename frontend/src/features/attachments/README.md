# Attachments Feature

## Muc tieu nghiep vu

Module `attachments` hien thi metadata cua file dinh kem duoc luu trong he thong (hoa don, chung tu scan, hinh anh). Day la man xem read-only, chuc nang upload/download thuc te phu thuoc vao storage strategy.

## Doc code theo thu tu

1. `services/attachmentService.ts`: goi GET /attachments, map response sang AttachmentItem.
2. `pages/AttachmentsPage.tsx`: hien thi bang danh sach, loc theo tu khoa, format kich thuoc file.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/attachments` | Danh sach metadata file dinh kem |

## Thong tin hien thi

- Ten file goc, MIME type, kich thuoc (format bytes/KB/MB), nguoi tai len, ngay tai.
- Lien ket tham chieu den entity: `reference_type` + `reference_id`.

## Luu y

- Attachments la read-only tren frontend, khong co nut upload.
- reference_type co the la: `goods_receipt`, `goods_issue`, `stock_adjustment`, ...
