# Alerts Feature

## Mục đích

Feature `alerts` gom cảnh báo tồn kho và thông báo vận hành vào một màn. Dữ liệu lấy từ backend module `alerts` và `notifications`.

## Route

```http
/alerts
```

## API sử dụng

- `GET /alerts`
- `GET /alerts?search=<title>&status=OPEN|READ|RESOLVED`
- `POST /alerts/generate`
- `PATCH /alerts/:id/read`
- `PATCH /alerts/:id/resolve`
- `GET /notifications`
- `GET /notifications?search=<title>`
- `POST /notifications/generate`
- `PATCH /notifications/:id/read`

## Lưu ý

- API list hiện không yêu cầu token.
- API generate yêu cầu token và permission `alerts:generate` hoặc `notifications:generate`.
- API read/resolve yêu cầu đăng nhập. `notifications/:id/read` chỉ đánh dấu thông báo thuộc user hiện tại.