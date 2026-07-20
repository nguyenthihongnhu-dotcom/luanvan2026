# Audit Logs Module

## Mục tiêu nghiệp vụ

Module `audit-logs` phục vụ truy vết thao tác hệ thống. Đây là module readonly ở API hiện tại; các module nghiệp vụ khác mới là nơi ghi audit log thông qua common audit repository.

## Đọc code theo thứ tự

1. `audit-logs.routes.ts`: endpoint list.
2. `audit-logs.validation.ts`: query filters.
3. `audit-logs.controller.ts`: parse query và trả `{ data }`.
4. `audit-logs.service.ts`: service boundary.
5. `audit-logs.repository.ts`: query bảng `audit_logs`.
6. `common/audit/audit.repository.ts`: helper dùng để ghi audit từ nghiệp vụ khác.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/audit-logs` | Danh sách audit log |

## Query params

| Param | Type | Mô tả |
| --- | --- | --- |
| `id` | number | Lọc theo log id |
| `search` | string | Tìm theo action |

## Luồng đọc log

```text
GET /audit-logs
  -> parseAuditLogsFilters(req.query)
  -> listAuditLogs(filters)
  -> findAuditLogs(filters)
      -> WHERE id = :id nếu có id
      -> WHERE action LIKE :search nếu có search
      -> SELECT * FROM audit_logs LIMIT 100
```

## Bảng dữ liệu chính

- `audit_logs`
- `users` nếu cần join người thao tác trong tương lai

## Vai trò trong hệ thống

Audit log nên trả lời được:

- Ai thao tác?
- Thao tác gì?
- Trên entity nào?
- Trước/sau thay đổi ra sao nếu có snapshot?
- Thao tác diễn ra lúc nào?

## Khi mở rộng module này

- Thêm filter theo `actor_user_id`, `entity_type`, `entity_id`, `dateFrom`, `dateTo`.
- Không cho sửa/xóa audit log qua API thông thường.
- Các module confirm/approve/reverse nên ghi audit ở cùng transaction nếu action quan trọng.
## Khi sửa module này

- Nếu chỉ thêm filter đọc log, sửa validation và repository.
- Nếu thêm nơi ghi audit, ưu tiên dùng `common/audit/audit.repository.ts` từ service/repository nghiệp vụ.
- Không tạo endpoint update/delete audit log.
- Nếu audit liên quan thay đổi tồn, ghi audit cùng transaction với thay đổi nghiệp vụ khi có thể.