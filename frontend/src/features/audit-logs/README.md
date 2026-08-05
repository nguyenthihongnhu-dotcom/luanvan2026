# Audit Logs Feature

## Muc tieu nghiep vu

Module `audit-logs` hien thi lich su thao tac toan bo nguoi dung trong he thong: ai lam gi, luc nao, tren doi tuong nao. Phuc vu kiem toan va truy vet su co. Append-only, khong the sua hoac xoa.

## Doc code theo thu tu

1. `services/auditLogService.ts`: goi GET /audit-logs, map sang AuditLogItem.
2. `pages/AuditLogsPage.tsx`: hien thi bang, phan trang, filter.
   - Filter: tu khoa search, action type, khoang thoi gian.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/audit-logs` | Danh sach nhat ky thao tac |

## Thong tin hien thi

| Cot | Y nghia |
|---|---|
| Nguoi thuc hien | Ho ten nhan vien |
| Hanh dong | CREATE / UPDATE / DELETE / CONFIRM / REVERSE / APPROVE / ... |
| Doi tuong | Loai ban ghi bi tac dong |
| Ma doi tuong | ID ban ghi cu the |
| Thoi gian | Timestamp thuc hien |

## Luu y

- Audit log la append-only o ca backend lan frontend.
- Dung de xac minh ai da confirm/reverse phieu trong truong hop tranh chap.
