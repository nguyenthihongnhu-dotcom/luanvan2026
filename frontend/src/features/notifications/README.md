# Notifications Feature

## Muc tieu nghiep vu

Module `notifications` hien thi thong bao gui den nguoi dung cu the (khac voi alert la gui toan he thong). Nguoi dung co the danh dau da doc hoac sinh thong bao thu cong.

## Doc code theo thu tu

1. `services/notificationService.ts`: goi GET /notifications, PATCH /notifications/:id/read, POST /notifications/generate.
2. `pages/NotificationsPage.tsx`: hien thi bang thong bao, loc theo is_read.
   - Tich hop trong AlertsPage tab "Thong bao".

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/notifications` | Danh sach thong bao cua user hien tai |
| PATCH | `/notifications/:id/read` | Danh dau da doc |
| POST | `/notifications/generate` | Sinh thong bao tu canh bao ton tai |

## Luu y

- Notifications hien thi trong tab "Thong bao" cua AlertsPage, khong co route rieng.
- Truong `is_read` quyet dinh badge "Chua doc" / "Da doc".
