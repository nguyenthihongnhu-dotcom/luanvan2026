# Hướng Dẫn Cài Đặt và Khởi Chạy - Bambi WMS

Tài liệu này hướng dẫn chi tiết các bước cài đặt, cấu hình môi trường và khởi chạy hệ thống **Bambi WMS (Warehouse Management System)** cho quản lý kho cửa hàng Mẹ & Bé.

---

## 📋 1. Yêu cầu hệ thống & Công nghệ

### Công nghệ sử dụng
- **Backend:** Node.js (>= 18.x), Express, TypeScript, MySQL 8.x, JWT Auth.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS / UI Components.
- **DevOps / Container:** Docker & Docker Compose (tùy chọn).

### Yêu cầu phần mềm trước khi cài đặt
- **Node.js:** phiên bản **v18.0.0** trở lên ([Tải tại nodejs.org](https://nodejs.org/))
- **npm:** đi kèm Node.js (v8.x trở lên)
- **MySQL Server:** phiên bản **8.0** hoặc **8.4** (nếu cài đặt thủ công)
- **Docker & Docker Compose:** (nếu muốn khởi chạy nhanh bằng container)
- **Git:** Để quản lý mã nguồn

---

## 🚀 2. Phương pháp 1: Khởi chạy nhanh bằng Docker Compose (Khuyên dùng)

Phương pháp này giúp dựng sẵn **MySQL Database** và **Backend API** tự động mà không cần cài đặt MySQL Server trên máy cục bộ.

### Các bước thực hiện:

1. **Mở terminal tại thư mục gốc dự án** (`luanvan2026`).

2. **Khởi chạy các dịch vụ bằng Docker Compose:**
   ```bash
   docker compose up --build
   ```

3. **Hệ thống Docker sẽ tự động:**
   - Dựng container MySQL 8.4 (`bambi-wms-mysql`) tại cổng `3306`.
   - Nạp toàn bộ lược đồ CSDL, cấu hình và dữ liệu mẫu (`backend/warehouse_management_mysql.sql`).
   - Build và khởi chạy container Backend Express (`bambi-wms-backend`) tại cổng `3000`.

4. **Khởi chạy Frontend ở máy máy cục bộ:**
   Mở thêm một cửa sổ terminal mới:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

5. **Truy cập ứng dụng:**
   - **Frontend App:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:3000](http://localhost:3000)
   - **Swagger API Docs:** [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 🛠️ 3. Phương pháp 2: Cài đặt thủ công trên máy cục bộ (Local Development)

Nếu bạn muốn phát triển hoặc tùy chỉnh trực tiếp mã nguồn CSDL và Server, làm theo các bước dưới đây.

### Bước 3.1: Khởi tạo Cơ sở dữ liệu MySQL

1. Đảm bảo dịch vụ MySQL Server 8.x đang chạy trên máy của bạn.
2. Tạo cơ sở dữ liệu mới có tên `warehouse_management`:
   ```sql
   CREATE DATABASE warehouse_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import dữ liệu khởi tạo và dữ liệu mẫu (`schema + seed data`):

   - **Cách A (sử dụng MySQL CLI):**
     ```bash
     cd backend
     mysql -u root -p warehouse_management < warehouse_management_mysql.sql
     ```

   - **Cách B (sử dụng Script Node.js tích hợp sẵn):**
     *Nên dùng nếu máy Windows chưa thêm `mysql` vào biến môi trường PATH:*
     ```bash
     cd backend
     npm install
     node scripts/run-sql.mjs warehouse_management_mysql.sql
     ```

---

### Bước 3.2: Cài đặt & Cấu hình Backend

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd backend
   ```

2. **Cài đặt các gói phụ thuộc (dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Chỉnh sửa các thông số trong `.env` phù hợp với máy của bạn (đặc biệt là thông tin kết nối MySQL):
   ```env
   # Server Configuration
   PORT=3000
   CORS_ORIGIN=*

   # Database Configuration
   DATABASE_URL=mysql://root:password_cua_ban@localhost:3306/warehouse_management
   DB_CONNECTION_LIMIT=10

   # Security & Auth
   JWT_SECRET=thay_doi_secret_nay_khi_len_production
   ACCESS_TOKEN_TTL_SECONDS=28800
   REFRESH_TOKEN_TTL_DAYS=30
   PASSWORD_RESET_TTL_MINUTES=15
   ```

4. **Chạy Backend ở chế độ Development:**
   ```bash
   npm run dev
   ```
   *Backend sẽ khởi chạy tại [http://localhost:3000](http://localhost:3000)*.

---

### Bước 3.3: Cài đặt & Cấu hình Frontend

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Tạo file `.env` từ file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Nội dung file `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Chạy Frontend ở chế độ Development:**
   ```bash
   npm run dev
   ```
   *Frontend sẽ khởi chạy tại [http://localhost:5173](http://localhost:5173)*.

---

## 🔑 4. Tài khoản dùng thử (Demo Accounts)

Sau khi import dữ liệu mẫu từ `warehouse_management_mysql.sql`, hệ thống đã sẵn sàng với các tài khoản thử nghiệm sau:

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Quản trị hệ thống (Admin)** | `admin@bambi.test` | `123456` | Toàn quyền hệ thống, quản lý người dùng, vai trò & phân quyền. |
| **Quản lý kho (Warehouse Manager)** | `manager@bambi.test` | `123456` | Quản lý kho, phê duyệt phiếu nhập/xuat/kiểm kê, điều chỉnh tồn. |
| **Nhân viên kho (Staff)** | `staff@bambi.test` | `123456` | Tạo phiếu nhập/xuất kho, thực hiện kiểm kê, xem danh mục & tồn kho. |

---

## 🧪 5. Kiểm tra & Kiểm thử (Validation & Testing)

Trước khi gửi commit hoặc báo cáo hoàn thành công việc, hãy kiểm tra hệ thống bằng các câu lệnh sau:

### Backend Tests & Quality Assurance
```bash
cd backend

# Kiểm tra Linter (ESLint)
npm run lint

# Kiểm tra biên dịch TypeScript
npm run build

# Chạy Unit Tests
npm test

# Chạy Integration Tests (Yêu cầu MySQL đang chạy và đã import dữ liệu mẫu)
npm run test:integration

# Chạy End-to-End Tests
npm run test:e2e
```

### Frontend Validation
```bash
cd frontend

# Kiểm tra kiểu dữ liệu TypeScript toàn dự án
npx tsc -b

# Kiểm tra build sản phẩm
npm run build
```

---

## 📦 6. Đóng gói & Deploy Production

### Deploy Backend
```bash
cd backend
npm install --omit=dev
npm run build
NODE_ENV=production npm run start:prod
```

### Deploy Frontend
```bash
cd frontend
npm install
npm run build
```
Nội dung sau khi build nằm trong thư mục `frontend/dist`. Bạn có thể phục vụ tĩnh qua Nginx, Caddy hoặc các dịch vụ Hosting Static (Vercel, Netlify, Cloudflare Pages).

---

## ❓ 7. Xử lý sự cố thường gặp (Troubleshooting)

1. **Lỗi `ER_ACCESS_DENIED_ERROR` khi Backend kết nối Database:**
   - Kiểm tra xem chuỗi `DATABASE_URL` trong `backend/.env` đã đúng `username` và `password` của MySQL chưa.
   - Kiểm tra MySQL đã cấp quyền kết nối tới cơ sở dữ liệu `warehouse_management` chưa.

2. **Lỗi kết nối API (CORS / Failed to fetch trên Frontend):**
   - Đảm bảo Backend đang chạy tại cổng `3000`.
   - Kiểm tra `VITE_API_BASE_URL` trong `frontend/.env` đã trỏ đúng về `http://localhost:3000`.

3. **Cổng (Port) 3000 hoặc 3306 bị chiếm dụng:**
   - Đóng các tiến trình đang chiếm giữ cổng hoặc thay đổi `PORT` trong `backend/.env` và cập nhật lại `VITE_API_BASE_URL` tương ứng.

---

## 📑 Tài liệu tham khảo thêm
- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [Thiết kế Database](backend/warehouse_database_design.md)
- [Hướng dẫn đọc Code cho Intern](backend/docs/intern-code-guide.md)
