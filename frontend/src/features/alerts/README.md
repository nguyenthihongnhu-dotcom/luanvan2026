# Alerts Feature

## Muc tieu nghiep vu

Module lerts quan ly canh bao van hanh kho va thong bao he thong. Bao gom: hien thi, danh dau da doc, xu ly canh bao; sinh canh bao/thong bao thu cong; loc theo trang thai va tu khoa.

## Doc code theo thu tu

1. services/alertService.ts: goi API list/generate/read/resolve cho ca alert va notification.
2. pages/AlertsPage.tsx: trang chinh, 2 tab (Canh bao / Thong bao), logic filter, action buttons.
   - loadData(): tai song song alert, notification, locations, stock, users.
   - unAction(): wrapper thuc thi action voi loading/error/message.
   - handleGenerateAlerts(): POST /alerts/generate.
   - handleGenerateNotifications(): POST /notifications/generate.
   - warehouseMap / variantMap / userMap: useMemo chuyen ID thanh ten hien thi.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | /alerts | Danh sach canh bao (filter: search, status) |
| POST | /alerts/generate | Sinh canh bao tu ton kho |
| PATCH | /alerts/:id/read | Danh dau da doc |
| PATCH | /alerts/:id/resolve | Danh dau da xu ly |
| GET | /notifications | Danh sach thong bao |
| POST | /notifications/generate | Sinh thong bao |
| PATCH | /notifications/:id/read | Danh dau thong bao da doc |

## Trang thai canh bao

- OPEN: canh bao moi, chua xu ly.
- READ: da doc nhung chua resolve.
- RESOLVED: da xu ly xong.

## Du lieu phu thuoc (tu backend)

- 	ransferService.listLocationOptions(): lay warehouse info cho warehouseMap.
- 	ransferService.listCurrentStock(): lay variant info cho variantMap.
- userService.listUsers(): lay ten nguoi dung cho userMap.

## Luu y

- Tab hien tai (alerts/notifications) luu trong state ctiveTab, khong tren URL.
- Filter search va status chi ap dung cho tab Canh bao.
- Permission lerts:generate va 
otifications:generate can duoc cap de nut Sinh canh bao hien thi.
