# Bambi WMS - Warehouse Management System

Bambi WMS là đồ án hệ thống quản lý kho cho cửa hàng Mẹ & Bé. Repo này có 2 phần chính:

- `backend/`: API server dùng Express + TypeScript + MySQL.
- `frontend/`: Web app dùng React + TypeScript + Vite.

Tài liệu này viết cho người đọc, đặc biệt là intern hoặc thành viên mới vào project. Mục tiêu là giúp bạn biết chạy project, hiểu luồng code, và biết nên sửa/thêm code ở đâu.

## 1. Kiến Trúc Tổng Quan

```text
Browser
  |
  | HTTP API
  v
Frontend React app
  |
  | fetch/httpClient
  v
Backend Express API
  |
  | mysql2/promise
  v
MySQL database
```

Frontend dùng API backend cho các màn core và vẫn giữ fallback cục bộ ở một số nơi để demo không bị trắng màn khi API tắt. Backend hiện đã có các module nghiệp vụ kho chính, chạy với MySQL thật và có seed data mẫu để demo.

## 2. Yêu Cầu Môi Trường

Cài sẵn:

- Node.js: nên dùng Node 20+ vì Vite/React Router hiện tại yêu cầu môi trường mới.
- npm
- MySQL 8+ nếu chạy backend với database thật.
- Git

## 3. Cài Đặt Lần Đầu

Ở root repo:

```bash
cd backend
npm install
cp .env.example .env
```

Cập nhật `backend/.env` theo máy local của bạn, đặc biệt là `DATABASE_URL` và `JWT_SECRET`.

Sau đó cài frontend:

```bash
cd ../frontend
npm install
cp .env.example .env
```

Frontend `.env` tối thiểu:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 4. Chạy Project

Chạy backend:

```bash
cd backend
npm run start:dev
```

Backend mặc định chạy ở:

```text
http://localhost:3000
```

Chạy frontend:

```bash
cd frontend
npm run dev
```

Vite sẽ in URL local, thường là:

```text
http://localhost:5173
```

## 5. Kiểm Tra Trước Khi Commit

Backend:

```bash
cd backend
npm run lint
npm run build
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run lint
npx tsc -b
npm run build
```

## 6. Cấu Trúc Repo

```text
luanvan2026/
  backend/
    src/
      app.ts
      main.ts
      common/
      config/
      database/
      modules/
      socket/
    warehouse_management_mysql.sql
    README.md

  frontend/
    src/
      app/
      features/
      layouts/
      shared/
    README.md
```

Đọc tiếp:

- Backend chi tiết: `backend/README.md`
- Frontend chi tiết: `frontend/README.md`

## 7. Quy Ước Làm Việc

Khi thêm tính năng mới:

1. Xác định tính năng thuộc backend, frontend, hay cả hai.
2. Backend: thêm/sửa trong đúng module tại `backend/src/modules/<module-name>`.
3. Frontend: thêm/sửa trong đúng feature tại `frontend/src/features/<feature-name>`.
4. Không gọi API trực tiếp trong component. Dùng service layer.
5. Không để business logic lớn trong component UI.
6. Không hardcode secret/token/password trong code.
7. Chạy lint/build trước khi báo đã xong.

## 8. Trạng Thái Hiện Tại

Backend đã có nền tảng production-oriented cho API, auth middleware, validation, database repository, một số transaction flow quan trọng của kho.

Frontend đã được refactor theo hướng feature-first, có app providers, shared services, auth context, dashboard layout và các màn hình quản lý cơ bản.

Backend core đã triển khai đầy đủ cho phạm vi đồ án: auth/session, phân quyền, cấu trúc kho, hàng hóa, lô hàng, tồn kho, nhập/xuất/chuyển kho, kiểm kê, điều chỉnh, cảnh báo, thông báo, báo cáo, audit log và OpenAPI. Frontend vẫn có fallback local ở một số màn để hỗ trợ demo khi backend/MySQL chưa chạy.
