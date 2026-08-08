# 🔄 QUY TRÌNH & SƠ ĐỒ LƯỒNG XỬ LÝ (PROCESS DIAGRAMS) - BAMBI WMS

**Tác giả:** Senior Software Architect  
**Mục tiêu:** Cung cấp bộ sơ đồ quy trình chuẩn hóa định dạng **Mermaid Sequence Diagram**, **Flowchart** và **State Diagram** sẵn sàng copy chèn vào Slide thuyết trình và Báo cáo Đồ án tốt nghiệp.

---

## 📌 MỤC LỤC SƠ ĐỒ
1. [Sơ đồ 1: Quy trình Xác thực JWT & Phân quyền RBAC (Sequence Diagram)](#1-sơ-đồ-1-quy-trình-xác-thực-jwt--phân-quyền-rbac-sequence-diagram)
2. [Sơ đồ 2: Quy trình Quét mã QR Nhập kho Nhanh Quick Receive (Sequence Diagram)](#2-sơ-đồ-2-quy-trình-quét-mã-qr-nhập-kho-nhanh-quick-receive-sequence-diagram)
3. [Sơ đồ 3: Quy trình Phân bổ Tồn kho Thuật toán FEFO/FIFO (Flowchart)](#3-sơ-đồ-3-quy-trình-phân-bổ-tồn-kho-thuật-toán-fefofifo-flowchart)
4. [Sơ đồ 4: Quy trình Xử lý Đồng thời Concurrency & Engine Đảo ngược Giao dịch Reversal Engine (Sequence Diagram)](#4-sơ-đồ-4-quy-trình-xử-lý-đồng-thời-concurrency--engine-đảo-ngược-giao-dịch-reversal-engine-sequence-diagram)
5. [Sơ đồ 5: Sơ đồ Chuyển đổi Trạng thái Chứng từ Kho (State Diagram)](#5-sơ-đồ-5-sơ-đồ-chuyển-đổi-trạng-thái-chứng-từ-kho-state-diagram)

---

## 1. Sơ đồ 1: Quy trình Xác thực JWT & Phân quyền RBAC (Sequence Diagram)

Sơ đồ mô tả chi tiết luồng Đăng nhập (Login), Cấp Token Pair, Kiểm tra quyền middleware (`requirePermission`) và Xoay vòng Token (`/auth/refresh`).

```mermaid
sequenceDiagram
    autonumber
    actor User as Thủ kho / Manager
    participant FE as React Vite Frontend
    participant Middleware as Auth & RBAC Middleware
    participant AuthSvc as Auth Service
    participant DB as MySQL Database

    %% Đăng nhập
    User->>FE: Nhập Email & Password
    FE->>Middleware: POST /auth/login (Email, Password)
    Middleware->>Middleware: loginRateLimit (Max 10 req/15min)
    Middleware->>AuthSvc: loginController(body)
    AuthSvc->>DB: SELECT * FROM users WHERE email = ?
    DB-->>AuthSvc: Trả về thông tin User & Password Hash
    AuthSvc->>AuthSvc: bcrypt.compare(Password, PasswordHash)
    
    alt Mật khẩu hợp lệ
        AuthSvc->>AuthSvc: Sign JWT AccessToken (TTL 15m)
        AuthSvc->>AuthSvc: Generate Opaque RefreshToken & SHA256 Hash
        AuthSvc->>DB: INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at)
        AuthSvc-->>FE: Trả về JSON { accessToken, refreshToken, user }
        FE->>FE: Lưu AccessToken vào RAM/State, RefreshToken vào Storage
    else Mật khẩu SAI
        AuthSvc->>DB: UPDATE users SET failed_login_attempts + 1
        AuthSvc-->>FE: Throw HttpError 401 (Invalid Credentials)
    end

    %% Gọi API cần phân quyền
    Note over FE, DB: Luồng Gọi API Cần Quyền (VD: Confirm Receipt)
    User->>FE: Nhấn "Xác nhận Nhập kho"
    FE->>Middleware: POST /goods-receipts/1/confirm (Header Bearer AccessToken)
    Middleware->>Middleware: verifyToken (Verify JWT Signature & Expiry)
    Middleware->>Middleware: requirePermission('goods_receipts:confirm')
    
    alt Đủ Quyền (Admin / Has Permission)
        Middleware->>DB: Thực thi nghiệp vụ Xác nhận Nhập Kho
        DB-->>FE: Trả về HTTP 200 OK (Confirmed)
    else Không đủ Quyền
        Middleware-->>FE: Trả về HTTP 403 Forbidden (PERMISSION_DENIED)
    end
```

---

## 2. Sơ đồ 2: Quy trình Quét mã QR Nhập kho Nhanh Quick Receive (Sequence Diagram)

Sơ đồ mô tả tính năng độc đáo Quét mã QR/Barcode trên máy quét cầm tay hoặc camera di động để nhập hàng siêu tốc vào vị trí ô kho.

```mermaid
sequenceDiagram
    autonumber
    actor Keeper as Thủ kho
    participant Scanner as Máy quét QR / Camera
    participant FE as QuickReceivePage.tsx
    participant Service as StockService.quickReceiveStock
    participant Repo as StockRepository
    participant DB as MySQL Database

    Keeper->>Scanner: Quét Mã sản phẩm (SKU/QR) & Mã Vị trí (Location QR)
    Scanner->>FE: Gửi chuỗi dữ liệu (VD: JSON hoặc SKU thô)
    FE->>Service: POST /stock/quick-receive (productScan, locationScan, quantity, lotNumber, expiryDate)
    
    Service->>Repo: quickReceiveStock(input)
    Repo->>DB: db.getConnection() -> beginTransaction()
    
    %% Lock Product & Location
    Repo->>DB: SELECT * FROM product_variants WHERE sku = ? FOR UPDATE
    Repo->>DB: SELECT * FROM warehouse_locations WHERE code = ? FOR UPDATE
    
    alt Tìm thấy Sản phẩm & Vị trí hợp lệ
        opt Có thông tin Lô / Hạn dùng
            Repo->>DB: INSERT / UPDATE product_batches (lot_number, expiry_date)
        end
        
        Repo->>DB: SELECT SUM(quantity) FROM stock_locations FOR UPDATE
        Repo->>DB: INSERT INTO stock_locations (product_id, location_id, batch_id, quantity)<br/>ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), version = version + 1
        Repo->>DB: INSERT INTO inventory_transactions (transaction_code, 'RECEIPT', quantity_before, quantity_after)
        Repo->>DB: commit()
        Repo-->>FE: Trả về kết quả QuickReceiveResult (Mã GD, Vị trí, Tồn cũ, Tồn mới)
        FE-->>Keeper: Hiển thị âm thanh/thông báo "Nhập Kho Thành Công!"
    else Sản phẩm / Vị trí KHÔNG tồn tại
        Repo->>DB: rollback()
        Repo-->>FE: Throw HttpError 404 (PRODUCT_NOT_FOUND / LOCATION_NOT_FOUND)
        FE-->>Keeper: Hiển thị Cảnh báo Lỗi màu đỏ
    end
```

---

## 3. Sơ đồ 3: Quy trình Phân bổ Tồn kho Thuật toán FEFO/FIFO (Flowchart)

Sơ đồ khối thể hiện chi tiết thuật toán sắp xếp và chọn lọc các lô hàng khả dụng trong kho phục vụ xuất hàng.

```mermaid
flowchart TD
    Start([Bắt đầu: Gửi Yêu cầu Phân bổ Tồn kho]) --> InputParams[/Nhận tham số: warehouseId, productVariantId, quantity, strategy/]
    InputParams --> CheckStrategy{Kiểm tra Chiến lược xuất?}
    
    CheckStrategy -- FEFO --> OrderFEFO[Sắp xếp Lô hàng theo Order:<br/>1. Expiry Date NULL đẩy xuống cuối<br/>2. Expiry Date Tăng dần<br/>3. Received Date Tăng dần<br/>4. Location Code Tăng dần]
    CheckStrategy -- FIFO --> OrderFIFO[Sắp xếp Lô hàng theo Order:<br/>1. Received Date Tăng dần<br/>2. Batch ID Tăng dần<br/>3. Location Code Tăng dần]
    
    OrderFEFO --> QueryDB[(Query SQL SELECT stock_locations<br/>WHERE available_quantity > 0<br/>AND status != EXPIRED/BLOCKED)]
    OrderFIFO --> QueryDB
    
    QueryDB --> LoopCandidates[Duyệt qua từng Lô hàng Candidate]
    
    LoopCandidates --> CheckQty{Remaining Qty > 0?}
    CheckQty -- Không (Đã đủ) --> AllocationDone[Hoàn tất Phân bổ Tồn kho]
    CheckQty -- Có (Vẫn thiếu) --> CheckLotTrack{Sản phẩm yêu cầu Lot/Expiry Track?}
    
    CheckLotTrack -- Có nhưng thiếu Lot/Expiry --> ThrowError422[Ném lỗi 422: BATCH_REQUIRED / EXPIRY_DATE_REQUIRED]
    CheckLotTrack -- Hợp lệ --> CalcAlloc[Tính AllocQty = MINAvailableQty, RemainingQty]
    
    CalcAlloc --> PushItem[Thêm Lô vào mảng Kết quả AllocatedItems]
    PushItem --> DeductQty[Giảm RemainingQty -= AllocQty]
    DeductQty --> LoopCandidates
    
    AllocationDone --> CheckFinalSum{AllocatedQty == RequestedQty?}
    CheckFinalSum -- Đúng --> ReturnResult[/Trả về Kết quả Preview AllocationResult/]
    CheckFinalSum -- Sai (Còn thiếu) --> ThrowError409[Ném lỗi 409: INSUFFICIENT_STOCK]
    
    ReturnResult --> End([Kết thúc Thành công])
    ThrowError422 --> EndErr([Kết thúc Lỗi])
    ThrowError409 --> EndErr
```

---

## 4. Sơ đồ 4: Quy trình Xử lý Đồng thời Concurrency & Engine Đảo ngược Giao dịch Reversal Engine (Sequence Diagram)

Sơ đồ thể hiện sự phối hợp giữa Khóa bi quan `FOR UPDATE`, Khóa lạc quan `version = version + 1` và Cơ chế Hoàn tác giao dịch bất biến.

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Quản lý Kho
    participant FE as Màn hình Quản lý Chứng từ
    participant Service as Reversal Engine Service
    participant Repo as ReversalRepository
    participant DB as MySQL Database

    Manager->>FE: Bấm "Hủy / Hoàn tác Phiếu Nhập" (Reverse)
    FE->>Service: POST /goods-receipts/10/reverse (note)
    Service->>Repo: reverseInventoryReference(referenceType='GOODS_RECEIPT', referenceId=10)
    
    Repo->>DB: db.getConnection() -> beginTransaction()
    
    Note over Repo, DB: Bước 1: Pessimistic Lock các Giao dịch Gốc
    Repo->>DB: SELECT * FROM inventory_transactions WHERE reference_type = ? AND reference_id = ? FOR UPDATE
    DB-->>Repo: Trả về mảng danh sách Giao dịch Gốc (Original Transactions)
    
    Note over Repo, DB: Bước 2: Kiểm tra Idempotency (Tránh Hoàn tác Trùng)
    Repo->>DB: SELECT id FROM inventory_transactions WHERE reversal_of_transaction_id IN (...) FOR UPDATE
    alt Đã từng Hoàn tác rồi
        Repo->>DB: rollback()
        Repo-->>FE: Throw Error (REFERENCE_ALREADY_REVERSED)
    end

    Note over Repo, DB: Bước 3: Duyệt từng Giao dịch & Kiểm tra Tồn kho
    loop Đối với mỗi Giao dịch Gốc
        Repo->>DB: SELECT id, quantity FROM stock_locations WHERE product_variant_id = ? AND location_id = ? FOR UPDATE
        Repo->>Repo: Tính toán số lượng mới (New Quantity = Before - OriginalQty)
        
        alt New Quantity < 0 (Tồn kho không đủ để trừ hoàn tác)
            Repo->>DB: rollback()
            Repo-->>FE: Throw Error (REVERSAL_INSUFFICIENT_STOCK)
        end
        
        Note over Repo, DB: Bước 4: Optimistic Versioning Update
        Repo->>DB: UPDATE stock_locations SET quantity = ?, version = version + 1 WHERE id = ? AND ? >= 0
        alt Affected Rows != 1
            Repo->>DB: rollback()
            Repo-->>FE: Throw Error (CONCURRENT_STOCK_UPDATE)
        end
        
        Note over Repo, DB: Bước 5: Chèn Giao dịch Đảo ngược Đối ứng (Audit Ledger)
        Repo->>DB: INSERT INTO inventory_transactions (transaction_type='REVERSAL', reversal_of_transaction_id=OriginalId, ...)
    end
    
    Repo->>DB: commit()
    Repo-->>FE: Trả về ReversalCount (Hoàn tất thành công)
```

---

## 5. Sơ đồ 5: Sơ đồ Chuyển đổi Trạng thái Chứng từ Kho (State Diagram)

Sơ đồ trạng thái (State Diagram) mô tả toàn bộ vòng đời hợp lệ của Chứng từ Nhập kho (Goods Receipt) và Chứng từ Xuất kho (Goods Issue).

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Khởi tạo Phiếu Nháp (Tạo bởi Thủ kho)
    
    state DRAFT {
        [*] --> EditItems : Chỉnh sửa danh sách Sản phẩm / Số lượng
        EditItems --> ValidateStock : Kiểm tra Tồn kho / Vị trí
    }
    
    DRAFT --> CONFIRMED : Bấm "Xác nhận Phiếu" (Yêu cầu Quyền Confirm)
    note right of CONFIRMED
        Hệ thống tự động:
        1. Thực thi Transaction SQL
        2. Cộng/Trừ tồn kho tại stock_locations
        3. Ghi Sổ cái inventory_transactions
        4. Ghi Nhật ký audit_logs
    end note
    
    CONFIRMED --> REVERSED : Bấm "Hoàn tác / Đổi trả" (Yêu cầu Quyền Reverse)
    note left of REVERSED
        Hệ thống tự động:
        1. Lock FOR UPDATE chống tranh chấp
        2. Tăng version = version + 1
        3. Tạo Giao dịch REVERSAL đối ứng
        4. Đổi trạng thái phiếu sang REVERSED
    end note
    
    REVERSED --> [*] : Trạng thái Đóng (Không thể thay đổi thêm)
    CONFIRMED --> [*] : Trạng thái Lưu trữ (Nếu không bị hủy)
```
