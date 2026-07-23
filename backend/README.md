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
npm run start:dev
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

Import schema và data mẫu theo thứ tự:

```bash
mysql -u root -p warehouse_management < warehouse_management_mysql.sql
mysql -u root -p warehouse_management < warehouse_sample_data.sql
```

## Biến môi trường

Nguồn sự thật là `src/config/config.ts` + `.env.example`. Bảng dưới liệt kê từng biến và giá trị nên dùng khi lên production.

| Biến | Bắt buộc | Mặc định | Ghi chú production |
| --- | --- | --- | --- |
| `PORT` | Không | `3000` | Đặt theo port reverse proxy trỏ vào. |
| `CORS_ORIGIN` | Không | `http://localhost:5173` | Đặt đúng origin frontend; có thể khai báo nhiều origin bằng dấu phẩy. Không dùng `*` ở production. |
| `DATABASE_URL` | Có | — | Connection string MySQL; dùng user có quyền tối thiểu cần thiết, không dùng `root`. |
| `DB_CONNECTION_LIMIT` | Không | `10` | Tăng theo tải thực tế và giới hạn kết nối MySQL server. |
| `JWT_SECRET` | Có | — | Phải là chuỗi random dài (32+ byte), khác nhau giữa các môi trường, không commit vào repo. |
| `ACCESS_TOKEN_TTL_SECONDS` | Không | `900` | TTL access token. |
| `REFRESH_TOKEN_TTL_DAYS` | Không | `30` | TTL refresh token/session. |
| `PASSWORD_RESET_TTL_MINUTES` | Không | `15` | TTL token reset mật khẩu. |

`config.ts` throw lỗi ngay khi thiếu `DATABASE_URL`/`JWT_SECRET`, nên service sẽ không start thay vì chạy với giá trị rỗng.

## Chạy production

```bash
npm install --omit=dev
npm run build
NODE_ENV=production npm run start:prod
```

## Chạy bằng Docker Compose

Từ root repo:

`ash
docker compose up --build
` 

Compose dựng MySQL 8.4, import schema/sample data và chạy backend tại http://localhost:3000.

`start:prod` chạy `node dist/main` (build output của `tsc`), không dùng `ts-node`. Đặt biến môi trường qua secret manager của hạ tầng deploy, không copy `.env` production vào source control.

Checklist đầy đủ trước khi lên production: [backend/docs/overview.md — Production readiness](docs/overview.md#9-production-readiness-checklist-trước-khi-lên-production).

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
- README trong module mô tả tính năng, endpoint, bảng chính và lưu ý bảo trì.