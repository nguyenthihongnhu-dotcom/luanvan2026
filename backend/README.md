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