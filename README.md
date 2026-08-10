# Bambi WMS - Warehouse Management System

Bambi WMS là đồ án hệ thống quản lý kho cho cửa hàng Mẹ & Bé.

Repo gồm hai phần chính:

- `backend/`: Express + TypeScript + MySQL API.
- `frontend/`: React + TypeScript + Vite web app.

## Đọc docs ở đâu

- [Hướng dẫn cài đặt chi tiết](docs/HUONG_DAN_CAI_DAT.md) — hướng dẫn từng bước cho máy mới, gồm cả xử lý lỗi thường gặp. Phần "Chạy backend/frontend" bên dưới chỉ là bản tóm tắt lệnh.

Backend:

- [Backend README](backend/README.md)
- [Backend docs tổng](backend/docs/README.md)
- [Guide đọc code backend cho intern](backend/docs/intern-code-guide.md)
- [Overview kiến trúc backend](backend/docs/overview.md)
- [Thiết kế database](backend/warehouse_database_design.md)
- Docs từng module: `backend/src/modules/<module>/README.md`

Frontend:

- [Frontend README](frontend/README.md)
- [Frontend docs tổng](frontend/docs/README.md)
- [Guide đọc code frontend cho intern](frontend/docs/intern-code-guide.md)
- [Frontend/backend UI gap](frontend/docs/backend-ui-gap.md)

## Kiến trúc tổng quan

```text
Browser
  -> Frontend React/Vite
  -> feature service layer
  -> shared axios httpClient
  -> Backend Express API
  -> mysql2/promise
  -> MySQL
```

Backend chia theo module nghiệp vụ. Mỗi module có route, controller, validation, service, repository, model và README riêng.

Frontend chia theo feature. Component không gọi API trực tiếp; gọi qua service layer trong feature rồi render state/loading/error/action.

## Chạy backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend mặc định:

```text
http://localhost:3000
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Chạy frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend `.env` tối thiểu:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Database

Import schema và data mẫu:

```bash
cd backend
mysql -u root -p warehouse_management < warehouse_management_mysql.sql
```

File trên đã gồm đủ lược đồ, dữ liệu khởi tạo (vai trò, quyền, đơn vị tính) và dữ liệu mẫu. Máy không có `mysql` trong PATH thì dùng script chạy bằng driver của backend:

```bash
cd backend
node scripts/run-sql.mjs warehouse_management_mysql.sql
```

## Chạy bằng Docker Compose

Từ root repo:

```bash
docker compose up --build
```

Compose dựng MySQL, import schema/sample data và chạy backend.

## Chạy production

Backend:

```bash
cd backend
npm install --omit=dev
npm run build
NODE_ENV=production npm run start:prod
```

Frontend build tĩnh, serve qua Nginx/static hosting bất kỳ:

```bash
cd frontend
npm install
npm run build
```

Deploy thư mục `frontend/dist`.

Checklist bảo mật/vận hành trước production: xem [Production readiness](backend/docs/overview.md#10-production-readiness).

## Kiểm tra trước khi báo xong

Backend:

```bash
cd backend
npm run lint
npm run build
npm test
npm run test:e2e
npm run test:integration
```

Frontend:

```bash
cd frontend
npx tsc -b
npm run build
```

`test:integration` cần MySQL đang chạy và đã import sample data.

## Module backend quan trọng

- Auth/Authorization: đăng nhập, token, role, permission.
- Catalog: danh mục, sản phẩm, SKU.
- Locations/Warehouses: cấu trúc kho, khu, kệ, tầng/vị trí.
- Stock: tồn hiện tại, gần hết hạn, allocation FEFO/FIFO.
- Goods Receipts: nhập kho, tăng tồn.
- Goods Issues: xuất kho, giảm tồn.
- Stock Transfers: chuyển kho.
- Stock Counts: kiểm kê.
- Stock Adjustments: điều chỉnh tồn.
- Reports/Alerts/Notifications/Audit Logs: báo cáo và hỗ trợ vận hành.

Để đọc nhanh backend, bắt đầu từ [backend/docs/intern-code-guide.md](backend/docs/intern-code-guide.md).