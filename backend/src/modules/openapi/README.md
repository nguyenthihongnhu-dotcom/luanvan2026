# OpenAPI Module

## Mục tiêu kỹ thuật

Module `openapi` cung cấp tài liệu API runtime qua OpenAPI JSON và Swagger UI. Đây là nơi frontend/dev có thể xem endpoint backend đang có.

## Đọc code theo thứ tự

1. `openapi.routes.ts`: mount `/openapi.json` và `/docs`.
2. `openapi.controller.ts`: document OpenAPI và Swagger UI HTML.
3. `app.ts`: module này được mount không có base prefix riêng.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/openapi.json` | OpenAPI document |
| GET | `/docs` | Swagger UI |

## Khi thêm endpoint mới

Cập nhật `openapi.controller.ts` nếu endpoint đó:

- Frontend đang gọi.
- Là API public/demo.
- Là flow nghiệp vụ quan trọng như confirm/approve/reverse.

## Mức độ chi tiết hiện tại

OpenAPI hiện mô tả:

- Base paths.
- Method chính.
- Response wrapper `{ data }`.
- Bearer auth cho endpoint protected.

Chưa mô tả đầy đủ từng DTO field cho mọi endpoint. Nếu cần nâng cấp, nên thêm schemas cho từng input/output theo module.

## Lưu ý

- Không để docs OpenAPI lệch route thật.
- Sau khi đổi route, search trong `openapi.controller.ts` để cập nhật.
- Swagger UI chỉ là docs, không thay thế integration test.