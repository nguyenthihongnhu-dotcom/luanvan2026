# Audit Logs Feature

## Route

`/audit-logs`

## Mục đích

Xem audit log để truy vết thao tác theo action/module/entity.

## Luồng code

- `pages/AuditLogsPage.tsx`: bảng log và filter theo search hiện có.
- `services/auditLogService.ts`: gọi `GET /audit-logs`.

## Lưu ý

- Backend hiện mới filter theo `action LIKE search`; muốn filter theo user/entity/date cần mở rộng backend trước.
