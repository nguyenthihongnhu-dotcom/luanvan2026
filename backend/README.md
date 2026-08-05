# Backend - Bambi WMS

Backend là API server cho hệ thống quản lý kho Bambi WMS, dùng Express + TypeScript + MySQL.

## Đọc docs ở đâu

- Docs tổng backend: [docs/README.md](docs/README.md)
- Guide đọc code cho intern: [docs/intern-code-guide.md](docs/intern-code-guide.md)
- Overview kiến trúc/API: [docs/overview.md](docs/overview.md)
- Thiết kế database: [warehouse_database_design.md](warehouse_database_design.md)
- Docs từng tính năng: `src/modules/<module>/README.md`

## Chạy backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:3000
```

Swagger UI:

```text
http://localhost:3000/docs
```

OpenAPI JSON:

```text
http://localhost:3000/openapi.json
```

## Database

Import lược đồ và dữ liệu mẫu (một file duy nhất):

```bash
mysql -u root -p warehouse_management < warehouse_management_mysql.sql
```

Nếu máy không có `mysql` trong PATH, chạy bằng driver `mysql2` của backend:

```bash
node scripts/run-migration.mjs warehouse_management_mysql.sql
```

Kiểm tra tính toàn vẹn của dữ liệu mẫu (nạp vào một CSDL nháp riêng, không đụng CSDL đang dùng):

```bash
node scripts/verify-sample-data.mjs
```

## Biến môi trường

Nguồn sự thật là `src/config/config.ts` và `.env.example`.

| Biến | Bắt buộc | Mặc định | Ghi chú production |
| --- | --- | --- | --- |
| `PORT` | Không | `3000` | Đặt theo port reverse proxy trỏ vào. |
| `CORS_ORIGIN` | Không | `http://localhost:5173` | Đặt đúng origin frontend; có thể khai báo nhiều origin bằng dấu phẩy. Không dùng `*` ở production. |
| `DATABASE_URL` | Có | Không có | Connection string MySQL; dùng user có quyền tối thiểu cần thiết, không dùng `root`. |
| `DB_CONNECTION_LIMIT` | Không | `10` | Tăng theo tải thực tế và giới hạn kết nối MySQL server. |
| `JWT_SECRET` | Có | Không có | Chuỗi random dài, khác nhau giữa các môi trường, không commit vào repo. |
| `ACCESS_TOKEN_TTL_SECONDS` | Không | `900` | TTL access token. |
| `REFRESH_TOKEN_TTL_DAYS` | Không | `30` | TTL refresh token/session. |
| `PASSWORD_RESET_TTL_MINUTES` | Không | `15` | TTL token reset mật khẩu. |

`config.ts` throw lỗi ngay khi thiếu `DATABASE_URL` hoặc `JWT_SECRET`, nên service không start với cấu hình rỗng.

## Chạy production

```bash
npm install --omit=dev
npm run build
NODE_ENV=production npm run start:prod
```

`start:prod` chạy `node dist/main`, không dùng `ts-node`. Đặt biến môi trường qua secret manager của hạ tầng deploy, không copy `.env` production vào source control.

## Chạy bằng Docker Compose

Từ root repo:

```bash
docker compose up --build
```

Compose dựng MySQL 8.4, import schema/sample data và chạy backend tại `http://localhost:3000`.

Checklist đầy đủ trước khi lên production: [backend/docs/overview.md - Production readiness](docs/overview.md#10-production-readiness).

## Kiểm tra

```bash
npm run lint
npm run build
npm test
npm run test:e2e
npm run test:integration
```

`test:integration` cần MySQL đang chạy và đã import sample data.

## Module pattern

Mỗi module nghiệp vụ nằm trong `src/modules/<module>` và thường có:

```text
<module>.routes.ts
<module>.controller.ts
<module>.service.ts
<module>.repository.ts
<module>.validation.ts
<module>.model.ts
README.md
```

Quy ước:

- Route khai báo endpoint và middleware.
- Controller xử lý HTTP boundary.
- Validation kiểm tra input bằng Zod.
- Service giữ business logic.
- Repository giữ SQL/database transaction.
- README trong module mô tả tính năng, endpoint, bảng chính, flow và lưu ý bảo trì.