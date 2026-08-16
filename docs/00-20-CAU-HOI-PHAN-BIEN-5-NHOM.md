# 🎯 BỘ 20 CÂU HỎI PHẢN BIỆN THEO 5 NHÓM — BAMBI WMS

> **Cách dùng:** mỗi câu trả lời đều kèm **đường dẫn file + số dòng thật** trong mã nguồn. Khi Hội đồng hỏi, mở đúng file đó ra chiếu.
> Mọi liên kết là **đường dẫn tương đối** tính từ thư mục `docs/` — bấm được trực tiếp trong VS Code và trên GitHub.
> **Đối chiếu mã nguồn:** ngày 16/08/2026, nhánh `fix/warehouse-zone-ui`.

## Mục lục

| Nhóm | Câu | Nội dung |
| :--- | :--- | :--- |
| 🏗️ 1. Kiến trúc & Công nghệ | [1](#c1) · [2](#c2) · [3](#c3) · [4](#c4) | Kiến trúc tổng thể · TypeScript · Thư mục backend · HTTP client FE |
| 📦 2. Nghiệp vụ kho cốt lõi | [5](#c5) · [6](#c6) · [7](#c7) · [8](#c8) | Phân cấp vị trí · Máy trạng thái kiểm kê · Scope & Snapshot · Cảnh báo |
| 💾 3. CSDL & Giao dịch | [9](#c9) · [10](#c10) · [11](#c11) · [12](#c12) | Toàn vẹn & tranh chấp · `stock_locations` · `SNAPSHOT_EMPTY` · Khóa ngoại |
| 🔒 4. Bảo mật & Phân quyền | [13](#c13) · [14](#c14) · [15](#c15) · [16](#c16) | Auth & RBAC · Validation · SQLi/XSS · Audit log |
| 🎨 5. Giao diện & UX | [17](#c17) · [18](#c18) · [19](#c19) · [20](#c20) | UX form kiểm kê · `TableLayout` · State management · Hiệu năng |

Phần cuối: [Ba điểm yếu nên chủ động nêu](#diem-yeu) · [Sơ đồ kèm theo](#so-do)

---

# 🏗️ NHÓM 1 — KIẾN TRÚC & CÔNG NGHỆ

<a id="c1"></a>
## Câu 1. Hệ thống dùng kiến trúc tổng thể nào và FE ↔ BE giao tiếp ra sao?

**Trả lời ngắn:** Kiến trúc **client–server tách rời (decoupled SPA + REST API)**, một repo chứa hai ứng dụng độc lập, giao tiếp qua **REST/JSON có JWT** và **WebSocket cho thông báo**.

### Ngăn xếp công nghệ

| Tầng | Công nghệ | Điểm vào |
| :--- | :--- | :--- |
| Frontend | React 19 + Vite 8 + TypeScript + TailwindCSS 4 (SPA) | [AppRouter.tsx](../frontend/src/app/router/AppRouter.tsx) |
| Backend | Node.js + **Express 5 thuần** (không NestJS) + TypeScript | [app.ts:31](../backend/src/app.ts#L31) |
| CSDL | MySQL 8 / InnoDB, driver `mysql2/promise` + connection pool | [db.ts](../backend/src/database/db.ts) |
| Realtime | Socket.IO 4 | [socket.ts](../backend/src/socket/socket.ts) |

### Hai kênh giao tiếp

**① REST/JSON đồng bộ.** `createApp()` mount 20 module theo prefix tài nguyên ([app.ts:75-96](../backend/src/app.ts#L75-L96)): `/auth`, `/stock`, `/goods-receipts`, `/stock-counts`, `/alerts`…

Quy ước response thống nhất toàn hệ thống:
```jsonc
// Thành công
{ "data": { ... } }
// Lỗi
{ "error": { "code": "STOCK_COUNT_SNAPSHOT_EMPTY", "message": "...", "requestId": "uuid" } }
```
([http.ts:41-67](../backend/src/common/http.ts#L41-L67)). Xác thực bằng **JWT Bearer** trong header `Authorization`.

**② WebSocket một chiều cho thông báo.** Client bắt tay kèm token → server verify → cho `join` room `user:<id>` → phát sự kiện `notification:new` ([socket.ts:55-97](../backend/src/socket/socket.ts#L55-L97)).

### Chống chịu ở biên

- **CORS whitelist** đọc từ biến môi trường `CORS_ORIGIN`, chỉ echo lại `Origin` nếu nằm trong danh sách, kèm `Vary: Origin` ([app.ts:37-65](../backend/src/app.ts#L37-L65))
- `express.json({ limit: '1mb' })` giới hạn kích thước body
- `app.disable('x-powered-by')` giảm lộ thông tin phiên bản
- Mọi request được gắn `x-request-id` để truy vết ([request-context.middleware.ts](../backend/src/common/middleware/request-context.middleware.ts))

> 💬 **Nếu bị hỏi "sao không dùng NestJS?"** → Express thuần + quy ước 6 file/module cho hiệu ứng phân lớp tương đương Nest nhưng không kéo theo DI container và decorator. Với phạm vi luận văn, ưu tiên **đọc được và giải thích được từng dòng** hơn là dùng framework nặng.

---

<a id="c2"></a>
## Câu 2. Vì sao chọn TypeScript cho cả FE và BE thay vì JavaScript thuần?

Bốn lý do, mỗi lý do đều có bằng chứng trong code:

### ① Bật `strict` toàn phần ở backend
[tsconfig.json:16-22](../backend/tsconfig.json#L16-L22) — `strict`, `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`.

Nghiệp vụ kho đầy trường nullable (`batch_id`, `actual_quantity`, `expiry_date`, `max_stock_level`). `strictNullChecks` biến "quên kiểm tra null" từ **bug runtime lúc demo** thành **lỗi biên dịch lúc code**.

### ② Kiểu hóa hàng trả về từ CSDL
```ts
export type StockCountItemRow = RowDataPacket & {
  id: number;
  system_quantity: number;
  actual_quantity: number | null;      // ← DB cho phép NULL, type nói rõ điều đó
  difference_quantity: number | null;
  ...
};
```
([stock-counts.model.ts:41-52](../backend/src/modules/stock-counts/stock-counts.model.ts#L41-L52)). Không có nó thì mọi kết quả SQL là `any` — mất sạch lợi ích kiểu.

### ③ Union type mô hình hóa máy trạng thái
`StockCountStatus` và `StockCountScopeType` là union chuỗi ([model:5-20](../backend/src/modules/stock-counts/stock-counts.model.ts#L5-L20)), khai báo song song bên frontend. Nhờ vậy bảng nhãn tiếng Việt:
```ts
const labels: Record<StockCountStatus, string> = { DRAFT: "Nháp", ... };
```
sẽ **báo lỗi biên dịch nếu thiếu một trạng thái** ([StockCountsPage.tsx:24-35](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L24-L35)).

### ④ Zod cho kiểu chạy thật khớp kiểu biên dịch
`validateInput<T>(schema: ZodType<T>, input: unknown): T` ([validate.ts:10](../backend/src/common/validation/validate.ts#L10)) — schema vừa chặn dữ liệu bẩn lúc chạy, vừa sinh ra type lúc biên dịch. Không phải khai báo hai lần, không thể lệch nhau.

> ⚠️ **Điểm yếu tự nhận:** FE và BE **không share package type chung**; các union đang viết lặp hai bên. Hướng cải tiến: tách `packages/shared-types`, hoặc sinh type từ OpenAPI (module [openapi](../backend/src/modules/openapi/openapi.controller.ts) đã có sẵn spec).

---

<a id="c3"></a>
## Câu 3. Kiến trúc thư mục Backend tổ chức theo mô hình nào?

**Modular Monolith + phân lớp (Layered / Clean-ish).** Mỗi nghiệp vụ là một thư mục **tự chứa** dưới [backend/src/modules/](../backend/src/modules/), luôn đủ 6 vai trò + 1 README:

```
modules/stock-counts/
├── stock-counts.routes.ts       ← khai báo endpoint + gắn middleware (verifyToken, requirePermission)
├── stock-counts.controller.ts   ← đọc req, gọi validation, trả res.json — KHÔNG chứa nghiệp vụ
├── stock-counts.service.ts      ← điều phối + dịch mã lỗi kỹ thuật sang HttpError
├── stock-counts.repository.ts   ← toàn bộ SQL và transaction
├── stock-counts.model.ts        ← type Input / Result / Row
├── stock-counts.validation.ts   ← schema zod
├── stock-counts.module.ts       ← export Router cho app.ts
└── README.md                    ← tài liệu module
```

**Luồng phụ thuộc một chiều:** `routes → controller → service → repository → db`. Không lớp nào gọi ngược lên.

### Phần dùng chung — [backend/src/common/](../backend/src/common/)

| Thư mục | Nội dung |
| :--- | :--- |
| `http.ts` | `HttpError`, `asyncHandler`, `errorHandler`, `notFoundHandler` |
| `middleware/` | `request-context`, `rate-limit`, `require-permission` |
| `audit/` | `insertAuditLog` — ghi nhật ký **trong cùng transaction** |
| `code/` | Sinh mã chứng từ (`KK-YYYYMM-NNN`, `DC-YYYYMM-NNN`) |
| `inventory/` | `reversal.repository.ts` — logic đảo chứng từ dùng chung cho nhập/xuất/chuyển |
| `validation/` | `validateInput`, tiện ích datetime |

Ngoài ra: `config/config.ts` (đọc & kiểm tra biến môi trường, **ném lỗi ngay khi khởi động** nếu thiếu `DATABASE_URL`/`JWT_SECRET`), `database/db.ts` (pool), `socket/`.

### Bằng chứng "controller mỏng"
Toàn bộ thân hàm duyệt phiếu kiểm kê chỉ 4 dòng ([controller:116-126](../backend/src/modules/stock-counts/stock-counts.controller.ts#L116-L126)):
```ts
export async function approveStockCountController(req: Request, res: Response): Promise<void> {
  const userId = requireAuthenticatedUser(req);
  const stockCountId = parseStockCountId(req.params.id);
  res.json({ data: await approveStockCount({ stockCountId, approvedBy: userId }) });
}
```

---

<a id="c4"></a>
## Câu 4. Frontend đóng gói request HTTP và xử lý lỗi tập trung như thế nào?

Toàn bộ nằm ở **một file duy nhất**: [httpClient.ts](../frontend/src/shared/services/httpClient.ts). Không component nào gọi `axios` hay `fetch` trực tiếp.

### ① Một axios instance duy nhất
`baseURL` lấy từ env ([:86-88](../frontend/src/shared/services/httpClient.ts#L86-L88)).

### ② Request interceptor — tự gắn token
Đọc access token từ `sessionStorage`, set header `Authorization: Bearer …` nếu chưa có ([:90-98](../frontend/src/shared/services/httpClient.ts#L90-L98)). Không màn hình nào phải tự nhớ truyền token.

### ③ Response interceptor — xử lý hết phiên tập trung
```ts
if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url) && !redirectingToLogin) {
  redirectingToLogin = true;      // ← chặn nhiều request 401 song song cùng redirect
  setAccessToken(null);
  window.location.assign('/login');
}
```
([:100-124](../frontend/src/shared/services/httpClient.ts#L100-L124)). Loại trừ `/auth/login|register|refresh` vì 401 ở đó là "sai mật khẩu", không phải "hết phiên".

### ④ Chuẩn hóa mọi lỗi về một class
`toHttpError()` gói lỗi mạng, lỗi axios, `Error` thường thành `HttpError { status, payload }` ([:126-140](../frontend/src/shared/services/httpClient.ts#L126-L140)). Quy ước: **`status = 0` nghĩa là không chạm được server**.

### ⑤ Dịch lỗi sang tiếng Việt theo mã nghiệp vụ
`getHttpErrorMessage()` ([:36-84](../frontend/src/shared/services/httpClient.ts#L36-L84)):
1. Phân biệt 3 nhóm đặc biệt — mất kết nối (`status 0`), hết phiên (401), thiếu quyền (403)
2. Tra bảng `domainErrorMessages` theo `error.code` backend trả về
3. **Đính kèm `requestId`** để đối chiếu log server

Ví dụ `STOCK_COUNT_SNAPSHOT_EMPTY` → *"Không tạo được phiếu kiểm kê vì Kho / Phạm vi được chọn hiện chưa có sản phẩm tồn kho nào để chụp dữ liệu đếm (Snapshot)."*

### ⑥ Façade `httpClient`
`get` / `post` / `patch` / `put` / `delete` ([:166-172](../frontend/src/shared/services/httpClient.ts#L166-L172)) — mai này đổi axios sang fetch chỉ sửa một file.

---

# 📦 NHÓM 2 — NGHIỆP VỤ QUẢN LÝ KHO CỐT LÕI

<a id="c5"></a>
## Câu 5. Mô hình phân cấp vị trí lưu trữ được thiết kế qua các cấp nào?

**Bốn cấp vật lý + một cấp tồn kho**, mỗi cấp một bảng, có khóa ngoại lên cấp cha:

```
warehouses              (Kho)   code, address, manager_user_id
  └─ warehouse_zones     (Khu)  UNIQUE(warehouse_id, code) + grid_row/col/size/orientation
      └─ warehouse_shelves (Kệ)  UNIQUE(zone_id, code) + sort_order
          └─ warehouse_locations (Ô/Tầng) UNIQUE(shelf_id, layer_no), code UNIQUE toàn bảng
              └─ stock_locations   (Tồn thực tế tại ô)
```

📄 [schema:106-208](../backend/warehouse_management_mysql.sql#L106-L208) · 📊 Sơ đồ ERD: [15_3-1-2_b-cau-truc-kho_erd.png](diagrams/15_3-1-2_b-cau-truc-kho_erd.png)

### Sáu quyết định thiết kế đáng bảo vệ

**① Mã ô mang đường dẫn đầy đủ.** Format `KHO-KHU-KE-TANG`, ví dụ `HCM01-A-01-03`. Cột `code` là `UNIQUE` **toàn bảng** nên **bắt buộc** có tiền tố kho — thiếu là đụng mã giữa hai kho ([locations/README.md:121](../backend/src/modules/locations/README.md#L121)).

**② Mã khu bất biến, tên khu đổi được.** `code` là định danh kỹ thuật nằm trong mã ô nên không cho sửa; muốn gọi tên khác thì đặt biệt danh ở cột `name` ([README:122](../backend/src/modules/locations/README.md#L122)).

**③ Ô có thuộc tính vận hành:**
- `location_type` — STANDARD / COLD / BULKY / SECURE / DAMAGED / RETURN
- `capacity_control_enabled` + `max_capacity` / `current_capacity`, kèm `CHECK (current_capacity >= 0)`
- `status` — ACTIVE / INACTIVE / LOCKED / MAINTENANCE / FULL
- `qr_code_value UNIQUE` cho quét mã nhận nhanh

**④ Khu có tọa độ mặt bằng.** `grid_row`, `grid_col`, `grid_size`, `grid_orientation` để FE vẽ sơ đồ kho; `NULL` = chưa đặt lên mặt bằng ([schema:146-151](../backend/warehouse_management_mysql.sql#L146-L151)).

**⑤ Ma trận kệ × tầng không được thủng lỗ.** Khi thêm kệ hoặc thêm tầng, backend tự lấp mọi ô còn thiếu trong khu (`POST /locations/sync-matrix`) chứ không để frontend loop từng ô.

**⑥ Xóa là soft delete và bị chặn khi còn hàng.** `DELETE /locations/zones/:id` mở transaction → khóa các ô còn hàng bằng `FOR UPDATE` → nếu `quantity > 0` hoặc `reserved_quantity > 0` thì trả **409 ZONE_NOT_EMPTY**. Kiểm tra và xóa nằm **chung một transaction** để không ai kịp nhập hàng vào giữa hai bước ([README:99-115](../backend/src/modules/locations/README.md#L99-L115)).

---

<a id="c6"></a>
## Câu 6. Quy trình chuyển trạng thái của một phiếu kiểm kê

📊 Sơ đồ trạng thái: [44_3-3-4_chuc-nang-kiem-ke-stock-count_state.png](diagrams/44_3-3-4_chuc-nang-kiem-ke-stock-count_state.png) · Activity: [29_3-2-3_activity-2-quy-trinh-kiem-ke_flow.png](diagrams/29_3-2-3_activity-2-quy-trinh-kiem-ke_flow.png)

```
        create                 start              record item(s)          submit
 (∅) ──────────► DRAFT ───────────────► IN_PROGRESS ◄──────────────► ─────────────► SUBMITTED
                   │                         ▲                                          │
                   │                         │  reject (kèm lý do bắt buộc)             │
                   │                         └──────────────────────────────────────────┤
                   │                                                                    │ approve
                   │                                                                    ▼
                   │                                            APPROVED ──► sinh stock_adjustment
                   └─ snapshot tồn chốt ngay tại bước CREATE                (type=COUNT, status=PENDING)
                                                                                        │
                                                                                        ▼
                                                           duyệt phiếu điều chỉnh → TỒN KHO MỚI ĐỔI
```

### Bảng chi tiết từng bước
📄 [stock-counts.repository.ts](../backend/src/modules/stock-counts/stock-counts.repository.ts)

| Bước | Endpoint | Quyền | Điều kiện | Hành động |
| :--- | :--- | :--- | :--- | :--- |
| Tạo | `POST /stock-counts` | `stock_counts:create` | Snapshot phải có dòng | Sinh mã `KK-…`, insert `stock_counts` (`DRAFT`) + toàn bộ `stock_count_items` với `system_quantity` ([:348-442](../backend/src/modules/stock-counts/stock-counts.repository.ts#L348-L442)) |
| Bắt đầu | `POST /:id/start` | `stock_counts:start` | Chỉ từ `DRAFT` | → `IN_PROGRESS`, set `snapshot_at` ([:444-503](../backend/src/modules/stock-counts/stock-counts.repository.ts#L444-L503)) |
| Ghi số đếm | `PATCH /:id/items/:itemId/count` | `stock_counts:count` | Chỉ khi `IN_PROGRESS` | Ghi `actual_quantity`, `counted_by`, `counted_at`; `difference_quantity` do **DB tự tính** ([:505-569](../backend/src/modules/stock-counts/stock-counts.repository.ts#L505-L569)) |
| Gửi duyệt | `POST /:id/submit` | `stock_counts:submit` | `IN_PROGRESS` **và đếm đủ 100% dòng** | → `SUBMITTED` ([:571-648](../backend/src/modules/stock-counts/stock-counts.repository.ts#L571-L648)) |
| Trả về sửa | `POST /:id/reject` | `stock_counts:approve` | Chỉ từ `SUBMITTED` | → **quay lại `IN_PROGRESS`**, xóa `submitted_by/at`, lưu `rejection_reason` ([:281-346](../backend/src/modules/stock-counts/stock-counts.repository.ts#L281-L346)) |
| Duyệt | `POST /:id/approve` | `stock_counts:approve` | `SUBMITTED`, không còn dòng chưa đếm | → `APPROVED` + sinh phiếu điều chỉnh cho dòng lệch ([:650-822](../backend/src/modules/stock-counts/stock-counts.repository.ts#L650-L822)) |

### Ba điểm dễ bị hỏi vặn — trả lời sẵn

**① "Từ chối" không đưa phiếu sang `REJECTED` — cố ý.**
Comment ngay trong code giải thích ([:273-280](../backend/src/modules/stock-counts/stock-counts.repository.ts#L273-L280)): mục đích là *cho sửa số rồi gửi lại*, không phải đóng phiếu. Thiếu đường này thì người duyệt phát hiện đếm sai chỉ còn hai lựa chọn tệ — **duyệt luôn con số sai**, hoặc **để phiếu treo vĩnh viễn**.
ENUM trong DB vẫn khai báo `REJECTED`/`COMPLETED`/`CANCELLED` nhưng luồng hiện tại không dùng tới → nhận thẳng đây là phần dự phòng chưa triển khai.

**② Duyệt kiểm kê KHÔNG trừ tồn ngay.**
Nó chỉ sinh `stock_adjustments` với `adjustment_type='COUNT'`, `status='PENDING'`, `reason_code='COUNT_VARIANCE'` ([:714-778](../backend/src/modules/stock-counts/stock-counts.repository.ts#L714-L778)). Phải duyệt tiếp phiếu điều chỉnh thì tồn mới đổi → **tách quyền đếm khỏi quyền sửa tồn** (nguyên tắc kiểm soát nội bộ). FE hiện banner nhắc "Đi duyệt phiếu điều chỉnh" ngay sau khi duyệt kiểm kê ([StockCountsPage.tsx:119-121](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L119-L121)).
📊 Sequence: [27_3-2-2_sequence-7-duyet-kiem-ke-sinh-phieu-dieu-chinh_sequence.png](diagrams/27_3-2-2_sequence-7-duyet-kiem-ke-sinh-phieu-dieu-chinh_sequence.png)

**③ Mọi bước đều idempotent.**
Gọi `start` khi đã `IN_PROGRESS`, `submit` khi đã `SUBMITTED`, `approve` khi đã `APPROVED` đều **trả về kết quả cũ thay vì ném lỗi** ([:458-465](../backend/src/modules/stock-counts/stock-counts.repository.ts#L458-L465), [:585-595](../backend/src/modules/stock-counts/stock-counts.repository.ts#L585-L595), [:664-692](../backend/src/modules/stock-counts/stock-counts.repository.ts#L664-L692)) — chống double-click và retry mạng.

---

<a id="c7"></a>
## Câu 7. Các phạm vi kiểm kê (`scopeType`) và cơ chế Snapshot tồn kho

### Sáu phạm vi
Khai báo trùng khớp ở **ba nơi**: ENUM trong DB, union TypeScript, `z.enum` của zod.

| `scopeType` | `scope_reference_id` trỏ tới | Điều kiện SQL sinh ra |
| :--- | :--- | :--- |
| `WAREHOUSE` | `NULL` | chỉ `w.id = ?` |
| `ZONE` | `warehouse_zones.id` | `+ wz.id = ?` |
| `SHELF` | `warehouse_shelves.id` | `+ ws.id = ?` |
| `LOCATION` | `warehouse_locations.id` | `+ wl.id = ?` |
| `SKU` | `product_variants.id` | `+ pv.id = ?` |
| `CATEGORY` | `categories.id` | `+ p.category_id = ?` |

`buildSnapshotScopeWhere()` ghép mệnh đề WHERE động **nhưng chỉ ghép tên cột cố định — giá trị luôn qua placeholder `?`** ([:147-180](../backend/src/modules/stock-counts/stock-counts.repository.ts#L147-L180)).

### Cơ chế Snapshot — "chụp ảnh" tồn kho

**Vấn đề nghiệp vụ:** giữa lúc phát phiếu và lúc nhân viên đếm xong, tồn hệ thống có thể đã đổi (có phiếu nhập/xuất khác chạy xen). Nếu so số đếm với tồn *hiện tại*, chênh lệch sẽ sai.

**Giải pháp:** chốt cứng `system_quantity` vào từng dòng `stock_count_items` **ngay khi tạo phiếu**, trong một transaction:

```sql
SELECT sl.product_variant_id, sl.batch_id, sl.location_id, sl.quantity
FROM stock_locations sl
JOIN product_variants pv    ON pv.id = sl.product_variant_id
JOIN products p             ON p.id  = pv.product_id
JOIN warehouse_locations wl ON wl.id = sl.location_id
JOIN warehouse_shelves ws   ON ws.id = wl.shelf_id
JOIN warehouse_zones wz     ON wz.id = ws.zone_id
JOIN warehouses w           ON w.id  = wz.warehouse_id
WHERE <scope> AND sl.quantity > 0
ORDER BY wl.id, pv.id, sl.batch_id
FOR UPDATE          -- ← khóa các dòng tồn trong phạm vi suốt transaction
```
([:182-235](../backend/src/modules/stock-counts/stock-counts.repository.ts#L182-L235))

> 💡 Chuỗi `JOIN` đi ngược đủ 4 cấp phân cấp chính là lý do **một điều kiện `wz.id = ?` cũng lọc đúng toàn bộ tồn của khu**.

**Fallback cho ô trống:** nếu phạm vi không có dòng tồn nào `> 0`, hệ thống chạy query thứ hai — lấy các ô trong phạm vi `CROSS JOIN` một biến thể ACTIVE với `quantity = 0`, `LIMIT 50` — để vẫn kiểm kê được ô rỗng hoặc ô mới ([:211-234](../backend/src/modules/stock-counts/stock-counts.repository.ts#L211-L234)).

> ⚠️ **Không nhất quán nhỏ nên tự nêu:** cột `snapshot_at` chỉ được ghi ở bước **start**, không phải ở bước **create** — dù dữ liệu snapshot đã chốt từ lúc create.

---

<a id="c8"></a>
## Câu 8. Phân hệ Cảnh báo tự động phát hiện những rủi ro tồn kho nào?

📊 Sơ đồ: [32_3-2-3_activity-5-sinh-canh-bao-va-thong-bao_flow.png](diagrams/32_3-2-3_activity-5-sinh-canh-bao-va-thong-bao_flow.png) · [57_3-3-9_chuc-nang-canh-bao-va-thong-bao_state.png](diagrams/57_3-3-9_chuc-nang-canh-bao-va-thong-bao_state.png)

`generateInventoryAlerts()` chạy **3 câu `INSERT … SELECT`** đọc từ view tổng hợp ([alerts.repository.ts:46-149](../backend/src/modules/alerts/alerts.repository.ts#L46-L149)):

| Rủi ro | `alert_type` | Mức độ | Điều kiện |
| :--- | :--- | :--- | :--- |
| Hết hàng | `OUT_OF_STOCK` | 🔴 CRITICAL | `total_available_quantity <= 0` |
| Sắp hết hàng | `LOW_STOCK` | 🟡 WARNING | `0 < available <= min_stock_level` (chỉ khi `min_stock_level > 0`) |
| Vượt tồn tối đa | `OVER_MAX_STOCK` | 🔵 INFO | `available > max_stock_level` |
| Cận hạn sử dụng | `NEAR_EXPIRY` | 🔴 CRITICAL nếu ≤ 7 ngày<br>🟡 WARNING nếu 8–60 ngày | Từ view `vw_near_expiry_stock` |

**Ngưỡng cận hạn 60 ngày** đóng cứng trong view: `pb.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY)` ([schema:973-999](../backend/warehouse_management_mysql.sql#L973-L999)) — mặt hàng mẹ & bé nhạy cảm hạn dùng nên đây là con số nghiệp vụ, không tùy tiện.

### Tính idempotent — điểm thiết kế quan trọng nhất
Mỗi `INSERT` có mệnh đề:
```sql
AND NOT EXISTS (
  SELECT 1 FROM alerts a
  WHERE a.status = 'OPEN' AND a.alert_type IN (...)
    AND a.warehouse_id = v.warehouse_id
    AND a.product_variant_id = v.product_variant_id
)
```
Chạy `generate` mười lần cũng **không sinh cảnh báo trùng**.

### Vòng đời cảnh báo
`OPEN` → `READ` (đã xem, chưa xử lý) → `RESOLVED` (lưu `resolved_by`, `resolved_at`).

> ⚠️ **Hai điểm nên tự nêu:**
> - ENUM trong DB còn `EXPIRED`, `LOCATION_NEAR_FULL`, `COUNT_VARIANCE`, `ABNORMAL_ADJUSTMENT`, `SECURITY` nhưng **code chưa sinh 5 loại này** — đã có chỗ trong mô hình dữ liệu, chờ triển khai.
> - Cảnh báo **chưa có scheduler**, phải gọi thủ công `POST /alerts/generate` (quyền `alerts:generate`). README module đã ghi hướng: đặt job ở tầng service riêng, repository chỉ giữ SQL ([alerts/README.md:66](../backend/src/modules/alerts/README.md#L66)).

---

# 💾 NHÓM 3 — CƠ SỞ DỮ LIỆU & GIAO DỊCH

<a id="c9"></a>
## Câu 9. Đảm bảo toàn vẹn dữ liệu và xử lý tranh chấp đồng thời bằng cơ chế nào?

> 💬 **Câu chốt một dòng:** *"Khóa bi quan để xếp hàng, khóa lạc quan `affectedRows` để bắt trường hợp lọt, ràng buộc CSDL để chặn cái cả hai đều sót."*

Hệ thống dùng **năm lớp phòng thủ chồng nhau**, không dựa vào một cơ chế duy nhất.

### Lớp 1 — Transaction ACID (InnoDB)
Mọi thao tác đổi tồn theo đúng khuôn mẫu ([stock-counts.repository.ts:290-346](../backend/src/modules/stock-counts/stock-counts.repository.ts#L290-L346)):
```ts
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  ...
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();          // ← luôn trả connection về pool
}
```
> 💡 Khối `finally` là chi tiết quan trọng: thiếu nó, pool 10 connection sẽ cạn sau vài lỗi.

### Lớp 2 — Khóa bi quan `SELECT … FOR UPDATE`
Có mặt ở **70 chỗ trên 16 file**. Khóa theo **thứ tự cố định**: khóa chứng từ trước (`lockCount`), rồi khóa dòng chi tiết (`lockCountItems` với `ORDER BY id`) — thứ tự nhất quán này là cách phòng deadlock. Trong xuất kho, các dòng `stock_locations` ứng viên bị khóa ngay khi chọn lô ([goods-issues.repository.ts:229-255](../backend/src/modules/goods-issues/goods-issues.repository.ts#L229-L255)).

### Lớp 3 — Cập nhật có điều kiện + kiểm `affectedRows` (khóa lạc quan)
Chốt chặn cuối cùng nằm **ngay trong câu UPDATE**:
```sql
UPDATE stock_locations
SET quantity = quantity - ?, version = version + 1
WHERE id = ? AND quantity - reserved_quantity >= ?     -- ← điều kiện nghiệp vụ trong WHERE
```
```ts
if (updateResult.affectedRows !== 1) throw new Error('CONCURRENT_STOCK_UPDATE');
```
([goods-issues.repository.ts:397-407](../backend/src/modules/goods-issues/goods-issues.repository.ts#L397-L407)). Nếu một transaction khác đã lấy mất hàng → `affectedRows = 0` → **toàn bộ phiếu rollback**. Cột `version` tăng ở **mọi** đường ghi tồn (nhập, xuất, chuyển, điều chỉnh, đảo phiếu).

### Lớp 4 — Ràng buộc khai báo ở CSDL
Đúng ngay cả khi ai đó sửa DB bằng tay:
- `CHECK (quantity >= 0)`, `CHECK (reserved_quantity >= 0)`, `CHECK (reserved_quantity <= quantity)` — `stock_locations`
- `CHECK (quantity > 0)` — `inventory_transactions`, `stock_adjustment_items`
- `CHECK (expiry_date > manufacture_date)` — `product_batches`
- `CHECK (max_stock_level >= min_stock_level)` — `product_variants`

### Lớp 5 — Cột sinh (generated column) thay vì tính ở tầng ứng dụng
- `available_quantity GENERATED ALWAYS AS (quantity - reserved_quantity) STORED` — không thể lệch với `quantity`
- `difference_quantity` của kiểm kê: `CASE WHEN actual_quantity IS NULL THEN NULL ELSE actual_quantity - system_quantity END STORED` ([schema:696-702](../backend/warehouse_management_mysql.sql#L696-L702))

> 💡 Người dùng **không thể khai gian số chênh lệch kiểm kê**, vì backend không bao giờ ghi cột đó — CSDL tự tính.

---

<a id="c10"></a>
## Câu 10. Bảng `stock_locations` đóng vai trò gì?

📊 Sơ đồ ERD: [17_3-1-2_d-ton-theo-vi-tri_erd.png](diagrams/17_3-1-2_d-ton-theo-vi-tri_erd.png)

`stock_locations` là **nguồn sự thật duy nhất (single source of truth) về tồn kho chi tiết**. Không có bảng "tồn tổng"; mọi con số tồn trong hệ thống đều quy về bảng này ([schema:385-413](../backend/warehouse_management_mysql.sql#L385-L413)).

### Hạt (grain) của bảng
Một dòng = **một biến thể sản phẩm × một ô lưu trữ × một lô hàng**.

```sql
CONSTRAINT uq_stock_location UNIQUE (product_variant_id, location_id, batch_key)
```

### ⭐ Mẹo kỹ thuật đáng nói: cột `batch_key`
MySQL **không coi hai `NULL` là trùng nhau**. Nếu đặt UNIQUE trực tiếp trên `batch_id`, hàng **không quản lô** (`batch_id = NULL`) sẽ tạo được **vô số dòng trùng** cho cùng một ô. Giải pháp:
```sql
batch_key BIGINT UNSIGNED GENERATED ALWAYS AS (IFNULL(batch_id, 0)) STORED
```
rồi đưa `batch_key` vào UNIQUE. Đây là chi tiết rất dễ được hỏi và cũng rất dễ ghi điểm.

### Bốn nhóm cột

| Cột | Vai trò |
| :--- | :--- |
| `quantity` | Tồn vật lý đang nằm ở ô |
| `reserved_quantity` | Đã giữ chỗ cho phiếu xuất chưa xác nhận |
| `available_quantity` | **Cột sinh STORED** = `quantity - reserved_quantity`, **có index `idx_stock_available`** → lọc "còn hàng bán được" rất nhanh |
| `version` | Bộ đếm khóa lạc quan, `+1` mỗi lần ghi |

### Bảng này phục vụ bốn nhóm chức năng
1. **Cấp phát FEFO/FIFO khi xuất kho** — chọn lô từ đây, `ORDER BY expiry_date ASC`, kèm `FOR UPDATE`
2. **Chụp snapshot kiểm kê** — `system_quantity` lấy trực tiếp từ `sl.quantity`
3. **Chặn xóa cấu trúc kho** — không cho xóa khu/kệ/tầng nếu còn dòng `quantity > 0` hoặc `reserved_quantity > 0`
4. **Nguồn của cả 3 view báo cáo** — `vw_current_stock`, `vw_product_total_stock`, `vw_near_expiry_stock` đều `FROM stock_locations sl` ([schema:911-999](../backend/warehouse_management_mysql.sql#L911-L999))

Bốn index đi kèm: `idx_stock_variant`, `idx_stock_location`, `idx_stock_batch`, `idx_stock_available`.

---

<a id="c11"></a>
## Câu 11. Điều kiện gì khiến hệ thống trả lỗi `STOCK_COUNT_SNAPSHOT_EMPTY`?

### Chỗ ném lỗi — đúng một dòng
Ngay đầu transaction tạo phiếu ([:356-360](../backend/src/modules/stock-counts/stock-counts.repository.ts#L356-L360)):
```ts
const snapshotRows = await getSnapshotRows(connection, input);
if (snapshotRows.length === 0) {
  throw new Error('STOCK_COUNT_SNAPSHOT_EMPTY');
}
```
Service dịch sang **HTTP 422** *"Phạm vi kiểm kê không có tồn kho để kiểm đếm"* ([service:39-43](../backend/src/modules/stock-counts/stock-counts.service.ts#L39-L43)); frontend hiển thị câu tiếng Việt đầy đủ hơn ([httpClient.ts:49](../frontend/src/shared/services/httpClient.ts#L49)).

### ⭐ Điểm mấu chốt cần nói cho đúng
Lỗi này **KHÔNG** xảy ra chỉ vì "kho rỗng". `getSnapshotRows()` có **hai truy vấn nối tiếp**, lỗi chỉ bật khi **cả hai đều trả về 0 dòng**:

| | Truy vấn | Rỗng khi nào |
| :--- | :--- | :--- |
| ① | Tồn thật — `stock_locations` trong phạm vi, `quantity > 0` | Phạm vi chưa có hàng |
| ② | Fallback ô trống — `warehouse_locations` trong phạm vi `CROSS JOIN` 1 biến thể ACTIVE, `LIMIT 50` | Phạm vi **không có ô lưu trữ nào**, hoặc **hệ thống không có `product_variants` nào `status='ACTIVE'`** |

### Ba nguyên nhân thực tế

1. **Kho/khu/kệ chưa được tạo cấu trúc ô** — chưa chạy tạo zone/shelf/layer nên `warehouse_locations` rỗng.
2. **`scopeReferenceId` không khớp `warehouseId`** — ví dụ chọn kho HCM01 nhưng chọn ID khu thuộc kho HN01. Hai điều kiện `w.id = ?` và `wz.id = ?` cùng nằm trong một WHERE nên **giao nhau bằng rỗng**.
   → Chính đây là lý do UI đã được sửa để **lọc danh sách khu/kệ/ô theo kho đang chọn** (xem [Câu 17](#c17)).
3. **Không còn `product_variants` nào ACTIVE** trong toàn hệ thống (`CROSS JOIN` với subquery `LIMIT 1` không có kết quả).

> 💡 Với `scopeType = 'SKU'` hoặc `'CATEGORY'`, fallback cũng lọc theo `pv.id` / `p.category_id` — nên chọn một SKU chưa từng nhập kho cũng dẫn tới lỗi này.

---

<a id="c12"></a>
## Câu 12. Các bảng chính liên kết với nhau qua những khóa ngoại nào?

📊 ERD theo cụm: [14 Xác thực & phân quyền](diagrams/14_3-1-2_a-xac-thuc-va-phan-quyen_erd.png) · [15 Cấu trúc kho](diagrams/15_3-1-2_b-cau-truc-kho_erd.png) · [16 Danh mục & lô hàng](diagrams/16_3-1-2_c-danh-muc-va-lo-hang_erd.png) · [17 Tồn theo vị trí](diagrams/17_3-1-2_d-ton-theo-vi-tri_erd.png) · [18 Lịch sử giao dịch](diagrams/18_3-1-2_e-lich-su-giao-dich_erd.png) · [19 Chứng từ nghiệp vụ](diagrams/19_3-1-2_f-chung-tu-nghiep-vu_erd.png) · [20 Vận hành & hệ thống](diagrams/20_3-1-2_g-van-hanh-va-he-thong_erd.png)

Toàn bộ FK đều **đặt tên tường minh** `fk_<bảng>_<đích>` và **không dùng `ON DELETE CASCADE`** — hệ thống chọn **soft delete** (`deleted_at`) để không mất lịch sử chứng từ.

### ① Phân quyền
```
users.role_id                    → roles.id
role_permissions.(role_id, permission_id) → roles/permissions   (PK kép)
user_sessions.user_id            → users.id
password_reset_tokens.user_id    → users.id
```

### ② Cấu trúc kho — chuỗi 4 cấp
```
warehouse_zones.warehouse_id → warehouses.id
  warehouse_shelves.zone_id    → warehouse_zones.id
    warehouse_locations.shelf_id → warehouse_shelves.id
```
Kèm `warehouses.manager_user_id → users.id` và bảng nối `user_warehouses (user_id, warehouse_id)` cho phân quyền theo kho.

### ③ Danh mục sản phẩm
```
categories.parent_id          → categories.id        ← TỰ THAM CHIẾU (danh mục cây)
products.category_id          → categories.id
products.brand_id             → brands.id
product_variants.product_id   → products.id
product_variants.unit_id      → units.id
product_batches.product_variant_id → product_variants.id
product_batches.supplier_id   → suppliers.id
```

### ④ Tồn kho — giao điểm ba chiều
```
stock_locations.product_variant_id → product_variants.id      (CÁI GÌ)
stock_locations.location_id        → warehouse_locations.id   (Ở ĐÂU)
stock_locations.batch_id           → product_batches.id       (LÔ NÀO)
```

### ⑤ Lịch sử giao dịch — bảng nhiều FK nhất (9 FK)
`inventory_transactions` có cả **FK tự tham chiếu**:
```
reversal_of_transaction_id → inventory_transactions.id   ← nối giao dịch đảo với giao dịch gốc
source_location_id         → warehouse_locations.id      ┐ cùng trỏ một bảng
destination_location_id    → warehouse_locations.id      ┘ (phục vụ chuyển kho)
performed_by / approved_by → users.id
```

### ⑥ Chứng từ nghiệp vụ
Mọi phiếu (`goods_receipts`, `goods_issues`, `stock_transfers`, `stock_counts`, `stock_adjustments`) đều có **cùng bộ FK người dùng theo vòng đời**: `created_by`, `submitted_by`, `approved_by`, `rejected_by` → `users.id`. Dòng chi tiết trỏ về phiếu cha + `product_variant_id` + `location_id` + `batch_id`.

### ⭐ FK liên kết hai nghiệp vụ quan trọng nhất
```sql
stock_adjustments.stock_count_id → stock_counts.id
```
Đây chính là **sợi dây truy vết** từ phiếu điều chỉnh ngược về phiếu kiểm kê đã sinh ra nó ([schema:752-753](../backend/warehouse_management_mysql.sql#L752-L753)), đi kèm `adjustment_type = 'COUNT'`.

### ⑦ Vận hành & hệ thống
`alerts` có 6 FK (kho / biến thể / lô / vị trí / người nhận / người xử lý), `notifications.user_id`, `audit_logs.user_id`, `attachments.uploaded_by`, `app_settings.updated_by`.

> ⚠️ **Nên tự nêu trước:** `attachments` dùng **quan hệ đa hình** `(entity_type, entity_id)` với index `idx_attachments_entity` chứ **không** có FK — đánh đổi có chủ ý để một bảng đính kèm phục vụ được mọi loại chứng từ. Hội đồng hay hỏi "sao bảng này thiếu FK".

---

# 🔒 NHÓM 4 — BẢO MẬT & PHÂN QUYỀN

<a id="c13"></a>
## Câu 13. Cơ chế Xác thực và Phân quyền hoạt động như thế nào?

📊 Sơ đồ: [07_2-4-1_6-quy-trinh-xac-thuc-va-phan-quyen_flow.png](diagrams/07_2-4-1_6-quy-trinh-xac-thuc-va-phan-quyen_flow.png) · [21 Sequence đăng nhập](diagrams/21_3-2-2_sequence-1-dang-nhap_sequence.png) · [25 Sequence refresh & logout](diagrams/25_3-2-2_sequence-5-lam-moi-token-va-dang-xuat_sequence.png) · [30 Activity phân quyền](diagrams/30_3-2-3_activity-3-phan-quyen-request-bat-ky_flow.png)

### A. Xác thực — mô hình hai token

| | Access token | Refresh token |
| :--- | :--- | :--- |
| Dạng | JWT ký HS256 | Chuỗi ngẫu nhiên **opaque** `randomBytes(48).toString('base64url')` |
| Nội dung | `sub` = userId, `role`, `permissions` | Không mang nội dung |
| Hạn | 900s (15 phút), cấu hình được | 30 ngày |
| Lưu ở đâu | Client — `sessionStorage` | Client + **hash SHA-256** trong `user_sessions.refresh_token_hash` |

([auth.service.ts:74-109](../backend/src/modules/auth/auth.service.ts#L74-L109))

> 💡 Server **không bao giờ lưu refresh token dạng thô** — lộ CSDL cũng không mạo danh được. Mỗi lần `refresh` là một lần **xoay token** (`rotateRefreshSession`): token cũ bị vô hiệu, cấp cặp mới ([:217-252](../backend/src/modules/auth/auth.service.ts#L217-L252)).

### B. Bảo vệ đăng nhập — bốn lớp
([auth.service.ts:170-215](../backend/src/modules/auth/auth.service.ts#L170-L215))

1. **Mật khẩu băm bcrypt** — `bcrypt.compare`, không so sánh chuỗi
2. **Thông điệp lỗi đồng nhất** cho "email không tồn tại" và "sai mật khẩu" → cùng là `INVALID_CREDENTIALS` 401, **chống dò tài khoản (user enumeration)**
3. **Khóa tạm sau nhiều lần sai** — `markLoginFailure` tăng `failed_login_attempts`, `locked_until` chặn bằng HTTP **423 Locked**
4. **Rate limit** 10 lần / 15 phút theo khóa `IP + email`, đặt luôn header `Retry-After` ([rate-limit.middleware.ts:59-71](../backend/src/common/middleware/rate-limit.middleware.ts#L59-L71))

Riêng quên mật khẩu: 5 lần / 15 phút, và `requestPasswordReset` **luôn trả `{ accepted: true }`** kể cả khi email không tồn tại — cũng là chống dò tài khoản.

### C. ⭐ Điểm thiết kế quan trọng nhất — token hợp lệ vẫn chưa đủ

Middleware `verifyToken` sau khi verify chữ ký JWT **vẫn truy vấn CSDL lại**:
```ts
const user = await findActiveAuthUserById(String(id));
if (!user) throw new HttpError(401, 'User is inactive or no longer exists', 'USER_INACTIVE');
```
([auth.service.ts:143-168](../backend/src/modules/auth/auth.service.ts#L143-L168), [auth.middleware.ts](../backend/src/modules/auth/auth.middleware.ts))

**Hệ quả:** khóa/xóa một tài khoản **có hiệu lực tức thì**, không phải chờ token hết hạn.

> 💬 Đây chính là câu trả lời cho phản biện kinh điển: *"JWT là stateless thì làm sao thu hồi quyền?"* — Truy vấn này đồng thời nạp lại quyền mới nhất, nên đổi vai trò cũng có hiệu lực ngay.

### D. Phân quyền — RBAC dạng `module:action`

Quyền nạp bằng một câu SQL gộp ([auth.repository.ts:14-39](../backend/src/modules/auth/auth.repository.ts#L14-L39)):
```sql
SELECT u.id, r.code AS role_code,
       GROUP_CONCAT(DISTINCT p.code ORDER BY p.code) AS permissions
FROM users u
JOIN roles r ON r.id = u.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p       ON p.id = rp.permission_id
WHERE u.id = :userId AND u.deleted_at IS NULL AND u.status = 'ACTIVE'
GROUP BY u.id, ...
```

**Bốn vai trò hệ thống:** `ADMIN`, `WAREHOUSE_MANAGER`, `STAFF`, `AUDITOR` ([schema:1005-1011](../backend/warehouse_management_mysql.sql#L1005-L1011)).

Riêng kiểm kê tách **5 quyền cho 5 bước** (`create`, `start`, `count`, `submit`, `approve`) để **tách người đếm khỏi người duyệt**.

Chốt chặn là middleware gắn ngay ở tầng route ([require-permission.middleware.ts](../backend/src/common/middleware/require-permission.middleware.ts)):
```ts
stockCountsRouter.post('/:id/approve',
  asyncHandler(verifyToken),                    // 401 nếu chưa đăng nhập
  requirePermission('stock_counts:approve'),    // 403 nếu thiếu quyền
  asyncHandler(approveStockCountController));
```
Ba đường được phép: `role === 'ADMIN'`, hoặc có wildcard `'*'`, hoặc có đúng mã quyền.

### E. Frontend chỉ là lớp trải nghiệm
`usePermissions()` ([usePermissions.ts](../frontend/src/shared/auth/usePermissions.ts)) **chỉ dùng để ẩn/hiện nút**.

> 💬 **Nếu bị hỏi "sửa localStorage có leo thang quyền được không?"** → Không. Mọi endpoint ghi đều đi qua `verifyToken` + `requirePermission` phía server, và quyền được **đọc lại từ CSDL** chứ không tin payload JWT của client.

> ⚠️ **Nên tự nêu:** `bcrypt.hash` dùng cost **12** khi đặt lại mật khẩu nhưng **10** khi tạo tài khoản ([:286](../backend/src/modules/auth/auth.service.ts#L286) vs [:304](../backend/src/modules/auth/auth.service.ts#L304)) — nên thống nhất về 12.

---

<a id="c14"></a>
## Câu 14. Dữ liệu đầu vào được validate ở tầng nào, dùng thư viện gì?

**Thư viện: Zod v4** (`zod ^4.4.3`), qua **một hàm cổng duy nhất**:
```ts
export function validateInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, formatZodError(result.error), 'VALIDATION_ERROR');
  return result.data;
}
```
([validate.ts](../backend/src/common/validation/validate.ts)). `formatZodError` gộp mọi lỗi thành `"đường.dẫn: thông báo; …"` nên client nhận **tất cả lỗi trong một lượt**.

### Tầng validate: controller — biên ngoài cùng
Service và repository luôn nhận dữ liệu đã sạch, đúng kiểu, **không phải phòng thủ lại**.

Quan trọng: **cả ba nguồn input đều được validate**, không chỉ body ([stock-counts.controller.ts](../backend/src/modules/stock-counts/stock-counts.controller.ts)):

| Nguồn | Hàm | Schema |
| :--- | :--- | :--- |
| `req.query` | `parseStockCountsFilters` | `id`/`search`/`status` có `.trim().max()` |
| `req.params` | `parseStockCountId` | `z.coerce.number().int().positive()` |
| `req.body` | `parseCreateStockCount` | object đầy đủ |

### Bốn kỹ thuật đáng nêu
([stock-counts.validation.ts](../backend/src/modules/stock-counts/stock-counts.validation.ts))

**① `z.coerce`** — tham số URL và form luôn là chuỗi; `coerce` ép sang số rồi mới kiểm `int().positive()`, tránh rải `Number()` khắp nơi.

**② `z.enum`** khóa cứng tập giá trị hợp lệ (`scopeTypeSchema` 6 giá trị, `z.enum(['FEFO','FIFO'])`) — không thể truyền trạng thái lạ vào CSDL.

**③ `.superRefine()` cho ràng buộc chéo trường** — ví dụ đắt giá:
```ts
if (value.scopeType !== 'WAREHOUSE' && !value.scopeReferenceId) {
  context.addIssue({ path: ['scopeReferenceId'],
    message: 'scopeReferenceId is required for this scope type' });
}
```
Ràng buộc "trường A bắt buộc *khi và chỉ khi* trường B khác giá trị X" **không thể diễn đạt bằng kiểu tĩnh**, và được chặn ngay ở validation chứ không đẩy xuống service.

**④ Tiêm định danh người dùng ở server, không nhận từ client:**
```ts
parseCreateStockCount(input, createdBy)   // ghép createdBy lấy từ req.user SAU khi parse
```
([:71-76](../backend/src/modules/stock-counts/stock-counts.validation.ts#L71-L76)) — client **không thể giả mạo** `createdBy` / `countedBy` / `approvedBy`.

### Hai tầng bổ trợ
- **Tầng CSDL là lưới an toàn cuối** — `CHECK`, `UNIQUE`, `FK`, `ENUM` (xem [Câu 9](#c9)) đúng ngay cả khi ai đó bỏ qua API
- **Có unit test cho validation** — [goods-receipts.validation.spec.ts](../backend/src/modules/goods-receipts/goods-receipts.validation.spec.ts), [goods-issues.validation.spec.ts](../backend/src/modules/goods-issues/goods-issues.validation.spec.ts), [stock-adjustments.validation.spec.ts](../backend/src/modules/stock-adjustments/stock-adjustments.validation.spec.ts) — chạy bằng Jest + ts-jest

---

<a id="c15"></a>
## Câu 15. Ngăn chặn SQL Injection và XSS bằng cách nào?

### A. SQL Injection — tham số hóa tuyệt đối

Toàn bộ truy vấn dùng **prepared statement** của `mysql2` theo hai kiểu.

**Positional placeholder `?`** — cho transaction:
```ts
await connection.query(
  `INSERT INTO stock_count_items (stock_count_id, product_variant_id, batch_id, location_id, system_quantity)
   VALUES (?, ?, ?, ?, ?)`,
  [insertResult.insertId, row.product_variant_id, row.batch_id, row.location_id, row.quantity],
);
```

**Named placeholder `:name`** — bật bằng `namedPlaceholders: true` ở pool ([db.ts:10](../backend/src/database/db.ts#L10)):
```ts
if (filters.search) {
  where.push('sc.count_code LIKE :search');
  params.search = `%${filters.search}%`;     // ← % ghép vào GIÁ TRỊ, không ghép vào SQL
}
```
> 💡 Chi tiết `%` nằm trong tham số chứ không trong chuỗi SQL — đúng chỗ nhiều dự án làm sai.

**Điều kiện WHERE động vẫn an toàn** vì chỉ *tên cột* (hằng trong code) được ghép chuỗi, *giá trị* luôn qua placeholder — xem `buildSnapshotScopeWhere` ([:147-180](../backend/src/modules/stock-counts/stock-counts.repository.ts#L147-L180)) và `findStockCounts` ([:35-75](../backend/src/modules/stock-counts/stock-counts.repository.ts#L35-L75)).

### ⭐ Chỗ duy nhất nội suy vào câu SQL — nên chủ động chỉ ra trước

```ts
ORDER BY ${allocationOrderBy(strategy)}
```
`ORDER BY` không đặt placeholder được. Nhưng an toàn vì:
1. `allocationOrderBy` là hàm **chỉ trả về một trong hai chuỗi hằng** ([goods-issues.repository.ts:50-67](../backend/src/modules/goods-issues/goods-issues.repository.ts#L50-L67))
2. `strategy` đã bị `z.enum(['FEFO','FIFO'])` chặn ngay ở validation ([goods-issues.validation.ts:17](../backend/src/modules/goods-issues/goods-issues.validation.ts#L17))

→ Dữ liệu người dùng **không bao giờ chạm vào chuỗi SQL**. Hội đồng sẽ tìm đúng chỗ này, nên nói trước.

### B. XSS — chặn theo mặc định của React

1. **React tự escape mọi giá trị nội suy `{}`**
2. **Kiểm chứng bằng grep: KHÔNG có một chỗ nào dùng `dangerouslySetInnerHTML` hay `innerHTML`** trong toàn bộ `frontend/src`
3. **Không có `eval` / `new Function` / `document.write`**
4. **Không nhận HTML từ người dùng** — mọi trường text đều qua zod `.trim().max()`, hiển thị dạng text thuần
5. **CORS whitelist** ([app.ts:37-51](../backend/src/app.ts#L37-L51)) + **giới hạn body 1MB** + **tắt `x-powered-by`**

### C. CSRF
Token nằm ở `sessionStorage` và gắn thủ công qua interceptor, **không dùng cookie** → trình duyệt không tự đính token vào request từ site khác → **không có bề mặt CSRF cổ điển**.

> ⚠️ **Hạn chế nên tự nhận (thà mình nói trước):**
> - Chưa dùng `helmet` / chưa đặt `Content-Security-Policy`, `X-Frame-Options`
> - Lưu token ở `sessionStorage` đổi lấy sự đơn giản: nếu có XSS thì token đọc được. Phương án cứng hơn là `httpOnly cookie` + CSRF token
> - `express.json` chưa giới hạn số phần tử mảng chi tiết phiếu (một phiếu 100.000 dòng vẫn lọt tới service)

---

<a id="c16"></a>
## Câu 16. Nhật ký hệ thống (`audit-logs`) ghi lại những thông tin gì?

### Cấu trúc bảng `audit_logs`
([schema:856-874](../backend/warehouse_management_mysql.sql#L856-L874))

| Cột | Ý nghĩa |
| :--- | :--- |
| `user_id` | **AI** làm |
| `action` | **LÀM GÌ** — `CREATE`, `START`, `SUBMIT`, `REJECT`, `APPROVE`, `CONFIRM`, `REVERSE` |
| `module` | **Ở PHÂN HỆ NÀO** — `stock_counts`, `goods_receipts`… |
| `entity_type` + `entity_id` | **TRÊN ĐỐI TƯỢNG NÀO** — ví dụ `STOCK_COUNT` #42 |
| `old_values` (JSON) | Trạng thái **TRƯỚC** |
| `new_values` (JSON) | Trạng thái **SAU** |
| `created_at` | **LÚC NÀO** (độ chính xác mili-giây) |
| `request_id`, `ip_address`, `user_agent` | Ngữ cảnh request |

Ba index phục vụ ba cách tra cứu: theo người (`user_id, created_at`), theo đối tượng (`entity_type, entity_id`), theo loại thao tác (`module, action`).

### ⭐ Đặc điểm thiết kế quan trọng nhất: log ghi *bên trong* transaction nghiệp vụ

`insertAuditLog(connection, {...})` nhận vào **chính `PoolConnection` đang mở** ([audit.repository.ts:13-40](../backend/src/common/audit/audit.repository.ts#L13-L40)).

**Hệ quả:**
- Nghiệp vụ thành công → **chắc chắn** có log (không thể tồn thay đổi mà không có vết)
- Nghiệp vụ rollback → log cũng biến mất (không có log "ma" của việc chưa từng xảy ra)

### Ví dụ log thực tế của một lần duyệt kiểm kê
([:792-804](../backend/src/modules/stock-counts/stock-counts.repository.ts#L792-L804))
```json
{ "action": "APPROVE", "module": "stock_counts",
  "entityType": "STOCK_COUNT", "entityId": 42,
  "oldValues": { "status": "SUBMITTED" },
  "newValues": { "status": "APPROVED", "adjustmentId": 17, "adjustmentItemCount": 3 } }
```

### Phạm vi bao phủ hiện tại
**16 điểm ghi log trên 6 module thay đổi tồn kho:**

| Module | Số điểm |
| :--- | :--- |
| `stock-counts` | 5 (CREATE / START / SUBMIT / REJECT / APPROVE) |
| `stock-adjustments` | 3 |
| `stock-transfers` | 3 |
| `goods-receipts` | 2 |
| `goods-issues` | 2 |

Đây là **chủ ý**: nhật ký tập trung vào thao tác **làm đổi tồn kho hoặc đổi trạng thái chứng từ**, không ghi thao tác đọc.

Tra cứu qua `GET /audit-logs`, join sang `users` lấy tên và email ([audit-logs.repository.ts](../backend/src/modules/audit-logs/audit-logs.repository.ts)).

> ⚠️ **Khoảng trống phải tự nêu:** hàm `insertAuditLog` **chưa điền `request_id`, `ip_address`, `user_agent`** dù ba cột đã có sẵn trong schema ([audit.repository.ts:17-39](../backend/src/common/audit/audit.repository.ts#L17-L39)). `requestId` đã được sinh và trả về client qua header `x-request-id` nhưng chưa truyền xuống repository.
> **Cách khắc phục:** mở rộng `AuditLogInput` thêm 3 trường, truyền từ controller xuống. Nói ra sẽ được đánh giá là hiểu hệ thống của mình.

### Bổ sung: log truy cập dạng structured JSON
Ghi ra stdout cho **mọi response có mã ≥ 400**, kèm `requestId`, method, path, statusCode, `durationMs` ([request-context.middleware.ts:24-51](../backend/src/common/middleware/request-context.middleware.ts#L24-L51)).

> 💡 Nhờ `requestId` chung, người dùng báo lỗi kèm mã yêu cầu là **tra ra được đúng dòng log**.

---

# 🎨 NHÓM 5 — GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG

<a id="c17"></a>
## Câu 17. Form "Tạo phiếu kiểm kê" đã cải tiến UX thế nào cho các trường tham chiếu?

### Vấn đề ban đầu
Trường `scopeReferenceId` là một **ô nhập số**, bắt người dùng **tự gõ ID trong cơ sở dữ liệu**. Comment trong code ghi thẳng:

> *"Trước đây ô này bắt người dùng tự gõ id trong DB"* ([StockCountsPage.tsx:126-129](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L126-L129))

Người dùng không có cách nào biết "khu B của kho HCM01" là ID 7, và gõ nhầm sẽ dẫn thẳng tới lỗi 422 `STOCK_COUNT_SNAPSHOT_EMPTY` ([Câu 11](#c11)).

### Năm cải tiến đã áp dụng

**① Đổi ô nhập ID thành dropdown chọn thực thể có tên.**
`scopeOptions` dựng danh sách theo đúng loại phạm vi đang chọn ([:130-158](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L130-L158)):

| scopeType | Hiển thị |
| :--- | :--- |
| ZONE | tên khu |
| SHELF | tên kệ |
| LOCATION | mã ô |
| SKU | `"SKU - Tên sản phẩm"` |
| CATEGORY | tên danh mục |

Kèm khử trùng lặp và **sắp xếp theo tiếng Việt** `localeCompare(a, b, "vi")` — chi tiết nhỏ nhưng đúng, vì sắp xếp mặc định đặt sai vị trí các chữ có dấu.

**② Lọc lựa chọn theo kho đang chọn:**
```ts
const inWarehouse = locationOptions.filter(
  (loc) => !formData.warehouseId || String(loc.warehouseId) === formData.warehouseId,
);
```
> 💡 Đây là biện pháp **loại bỏ tận gốc nguyên nhân số 2** của lỗi `SNAPSHOT_EMPTY` — không còn khả năng chọn khu thuộc kho khác.

**③ Nhãn, gợi ý và câu giải thích riêng cho từng phạm vi.**
Hàm `getScopeReferenceConfig()` ([:66-101](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L66-L101)) trả về bộ ba `label` / `placeholder` / `helpText`:

| scopeType | Nhãn | Câu giải thích dưới ô |
| :--- | :--- | :--- |
| ZONE | Khu kho | *Chỉ kiểm kê hàng nằm trong khu này của kho đã chọn.* |
| SHELF | Kệ kho | *Chỉ kiểm kê hàng nằm trên kệ này.* |
| LOCATION | Ô lưu trữ | *Chỉ kiểm kê đúng một ô lưu trữ.* |
| SKU | Sản phẩm / Biến thể | *Chỉ kiểm kê một biến thể sản phẩm trong toàn kho đã chọn.* |
| CATEGORY | Danh mục sản phẩm | *Kiểm kê toàn bộ sản phẩm thuộc danh mục này.* |

Người dùng không còn phải đoán "reference id" nghĩa là gì — nhãn nói **đúng thứ họ đang chọn**.

**④ Ẩn hoàn toàn trường khi không cần, và reset khi đổi phạm vi.**
Chọn "Toàn kho" thì trường biến mất; đổi loại phạm vi thì `scopeReferenceId` được xóa về rỗng ngay trong `onChange` ([:433](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L433)) — tránh giữ lại ID của khu khi người dùng đã chuyển sang chọn danh mục.

**⑤ Thông điệp lỗi giải thích được nguyên nhân.**
Nếu vẫn lọt lỗi, FE hiện câu đầy đủ thay vì mã kỹ thuật ([httpClient.ts:49](../frontend/src/shared/services/httpClient.ts#L49)).

### Ba cải tiến UX khác cùng màn hình
Cùng một tinh thần: **giao diện phải phản ánh đúng máy trạng thái backend**.

- **Chỉ hiện ô nhập số đếm khi phiếu ở `IN_PROGRESS`** — `canCount = selectedCount.status === "IN_PROGRESS"`; ngoài trạng thái đó chuyển sang dạng chỉ đọc kèm dải cảnh báo màu hổ phách giải thích *"Phiếu đang ở trạng thái X nên không nhập được số đếm"*, thay vì rải các ô nhập mờ khắp bảng ([:477-514](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L477-L514))
- **Banner nhắc bước tiếp theo sau khi duyệt** — vì duyệt kiểm kê chưa đổi tồn, giao diện hiện nút "Đi duyệt phiếu điều chỉnh" dẫn thẳng tới phiếu vừa sinh ([:390-410](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L390-L410))
- **Tóm tắt ngay trên tiêu đề modal** — tổng số dòng và **số dòng lệch tô đỏ**

---

<a id="c18"></a>
## Câu 18. Component `TableLayout` giải quyết vấn đề gì?

[TableLayout.tsx](../frontend/src/shared/ui/Table/TableLayout.tsx) là component **generic `<T>`**, nhận đúng 5 prop ([types.ts](../frontend/src/shared/ui/Table/types.ts)): `columns`, `dataSource`, `rowKey`, `isLoading`, `className`.

### Bốn vấn đề nó giải quyết

**① Trùng lặp markup trên ~20 màn hình.**
Toàn hệ thống có hơn 20 trang danh sách (sản phẩm, tồn kho, phiếu nhập, phiếu xuất, kiểm kê, cảnh báo, nhật ký…). Không có component chung thì mỗi trang phải tự viết `<table><thead><tr><th>…`. Giờ mỗi trang chỉ khai báo dữ liệu:
```tsx
<Tablelayout columns={columns} dataSource={counts} rowKey="id" isLoading={isLoading} />
```

**② Trạng thái rỗng và trạng thái tải nhất quán.**
Hai trạng thái này là chỗ **hay bị bỏ quên nhất**. Component xử lý sẵn: spinner + *"Đang tải dữ liệu kho…"*, và trạng thái rỗng có **gợi ý hành động** *"Thử thay đổi bộ lọc hoặc thêm bản ghi mới"* ([:22-34](../frontend/src/shared/ui/Table/TableLayout.tsx#L22-L34)) — không phải một ô trắng khó hiểu. Cả hai dùng `colSpan={columns.length}` để căn giữa đúng toàn bảng.

**③ ⭐ Responsive bằng cách đổi hẳn cấu trúc, không phải cuộn ngang.**
Điểm thiết kế đáng nói nhất — cùng một `columns` render ra **hai bố cục khác nhau**:

| Kích thước | Cấu trúc |
| :--- | :--- |
| Mobile (`md:hidden`) | Mỗi bản ghi thành một `<article>` dạng danh sách định nghĩa `<dt>`/`<dd>`: nhãn cột bên trái, giá trị bên phải, xuống dòng được (`break-words`) |
| Desktop (`hidden md:block`) | Bảng truyền thống với `whitespace-nowrap` |

> 💬 **Lý do nghiệp vụ:** nhân viên kho dùng điện thoại khi đi giữa các kệ; bảng 8 cột cuộn ngang trên màn hình 5 inch là không dùng được.

**④ Chống nhảy layout.**
Prop `width` được áp cả `width` lẫn `minWidth` cho `<th>` và `<td>` ([:65](../frontend/src/shared/ui/Table/TableLayout.tsx#L65), [:92](../frontend/src/shared/ui/Table/TableLayout.tsx#L92)); comment trong `types.ts` ghi rõ mục đích: *"Prevents layout shift for action columns"* — cột chứa nút bấm không co giãn theo nội dung.

### Cơ chế mở rộng — `render` callback
```tsx
{ key: "scope_type", title: "Phạm vi", render: (value) => scopeLabel(value as StockCountScopeType) }
```
Mặc định ô hiển thị giá trị thô; có `render` thì trả về JSX bất kỳ (badge trạng thái, nút thao tác, số định dạng `toLocaleString("vi-VN")`). `rowKey` chấp nhận cả tên trường lẫn hàm, có phương án dự phòng là chỉ số dòng.

> 💡 **Bổ sung:** dự án còn có [DataGridLayout.tsx](../frontend/src/shared/ui/DataGrid/DataGridLayout.tsx) bọc `ag-grid-react` cho lưới cần sắp xếp/lọc/ảo hóa nặng. `TableLayout` phục vụ danh sách thường, `DataGridLayout` cho lưới dữ liệu lớn.

---

<a id="c19"></a>
## Câu 19. Chiến lược quản lý State ở Frontend

**Không dùng Redux, Zustand, MobX hay React Query** — kiểm chứng ở [package.json](../frontend/package.json): dependencies chỉ có React, React Router, antd, ag-grid, axios, socket.io-client, qrcode.

Chiến lược là **ba tầng theo phạm vi sống của dữ liệu**.

### Tầng 1 — State cục bộ trong component (mặc định)
Dữ liệu của một màn hình sống và chết cùng màn hình đó: `useState` + `useEffect` + `useMemo`.

`StockCountsPage` giữ 12 mẩu state ([:104-121](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L104-L121)) và nạp dữ liệu bằng **một `Promise.all` 6 lời gọi song song**, kèm `.catch(() => [])` trên các nguồn phụ để **một API phụ hỏng không làm trắng cả trang** ([:165-172](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L165-L172)).

> 💡 Dữ liệu dẫn xuất (bản đồ tra cứu, danh sách lựa chọn) dùng `useMemo` chứ **không lưu thành state** — tránh sai lệch giữa hai nguồn.

### Tầng 2 — React Context cho state xuyên màn hình
Chỉ đúng **hai context**, đều theo mẫu tách 3 file (`Context.ts` / `Provider.tsx` / `useX.ts`) để không phá Fast Refresh của Vite:

| Context | Nội dung |
| :--- | :--- |
| `AuthContext` | `{ user, isAuthenticated, login, logout }` ([AuthProvider.tsx](../frontend/src/features/auth/context/AuthProvider.tsx)) — giá trị bọc `useMemo` để không render lại toàn cây |
| `SidebarContext` | Trạng thái đóng/mở menu |

Hook `useAuth()` **ném lỗi nếu dùng ngoài Provider** — biến một lỗi âm thầm thành lỗi rõ ràng.

### Tầng 3 — State ngoài React (module-scope singleton)
Hai thứ không nên đưa vào cây React:
- **Access token** — ở `sessionStorage` qua `setAccessToken`/`getAccessToken`, vì interceptor axios cần đọc nó **ngoài context React** ([httpClient.ts:9-22](../frontend/src/shared/services/httpClient.ts#L9-L22))
- **Kết nối socket** — singleton trong [socketClient.ts](../frontend/src/shared/services/socketClient.ts), ngắt khi `logout`

### ⭐ Vấn đề đã xử lý — mất quyền khi F5
Ví dụ tốt để kể: access token ở `sessionStorage` nhưng `user` chỉ ở state React → nhấn F5 là mất `role` + `permissions`, tài khoản admin **tụt về mặc định "Nhân viên" và mất hết nút thao tác**.

Cách sửa — `readStoredUser()` khôi phục user từ `sessionStorage`, **nhưng chỉ khi token còn tồn tại**; không có token thì coi như đã đăng xuất, JSON hỏng thì tự dọn ([AuthProvider.tsx:15-38](../frontend/src/features/auth/context/AuthProvider.tsx#L15-L38)).

### Tách mã theo route
Mọi trang đều `React.lazy()` + `<Suspense>` với fallback tiếng Việt ([AppRouter.tsx](../frontend/src/app/router/AppRouter.tsx)) — bundle đầu vào chỉ tải màn hình đang xem.

> ⚠️ **Đánh đổi phải tự nhận:** không có tầng cache dùng chung, nên **mỗi màn hình tự tải lại danh mục dùng chung**. `StockCountsPage.loadCounts()` gọi lại cả 6 API (kể cả danh sách kho, vị trí, sản phẩm, danh mục — dữ liệu gần như không đổi) **sau mỗi thao tác** ([:241-250](../frontend/src/features/stock-counts/pages/StockCountsPage.tsx#L241-L250)). Hướng khắc phục ở [Câu 20](#c20).

---

<a id="c20"></a>
## Câu 20. Hướng tối ưu hiệu năng khi dữ liệu lên hàng trăm nghìn bản ghi

### Hiện trạng phải nói thẳng
Mọi endpoint danh sách đang **`LIMIT 100` đóng cứng, không phân trang, không trả tổng số** — **28 chỗ trên 22 file** (`findStockCounts`, `findAlerts`, `findAuditLogs`…).

Ở quy mô luận văn thì chạy tốt; ở 100.000 bản ghi thì người dùng **không thể xem quá 100 dòng đầu**. Đây là **giới hạn thiết kế đã biết**, không phải bug bị bỏ sót.

### Kế hoạch tối ưu theo thứ tự hiệu quả / chi phí

**① Phân trang thật + đẩy lọc/sắp xếp xuống SQL** *(ưu tiên cao nhất)*
Thay `LIMIT 100` bằng `LIMIT :limit OFFSET :offset`, trả kèm `{ data, total, page, pageSize }`.
Với bảng rất lớn (`inventory_transactions`, `audit_logs`) dùng **keyset pagination**:
```sql
WHERE id < :lastId ORDER BY id DESC LIMIT :n
```
Độ phức tạp **không tăng theo số trang**, khác với `OFFSET 100000` phải quét bỏ 100.000 dòng.

**② Sửa các mẫu truy vấn không dùng được index**
- `LIKE '%tu-khoa%'` có `%` ở đầu nên **không dùng được B-tree index** → toàn bộ tìm kiếm hiện là full scan
- Bảng `products` **đã có sẵn `FULLTEXT INDEX ftx_products_name_description`** nhưng chưa dùng → chuyển sang `MATCH(name, description) AGAINST(:q IN BOOLEAN MODE)`
- Bổ sung index phủ (covering index) cho các tổ hợp lọc hay dùng

**③ Khử N+1 write khi tạo phiếu kiểm kê**
`createStockCountTransaction` đang `INSERT` **từng dòng một trong vòng lặp** ([:393-413](../backend/src/modules/stock-counts/stock-counts.repository.ts#L393-L413)). Kiểm kê toàn kho 50.000 vị trí = **50.000 round-trip trong một transaction** — vừa chậm vừa giữ khóa rất lâu.
→ Sửa thành **một câu `INSERT … SELECT`** dùng lại chính truy vấn snapshot (dữ liệu đã nằm sẵn trong MySQL, không cần mang lên Node rồi đẩy ngược xuống), hoặc chí ít multi-row `VALUES` theo lô 1.000 dòng.

**④ Vật chất hóa tồn tổng hợp**
`vw_product_total_stock` là view có `GROUP BY` **quét toàn bảng `stock_locations` mỗi lần gọi**, và nó là đầu vào của cả sinh cảnh báo lẫn báo cáo. Ở 500.000 dòng tồn, mỗi lần `POST /alerts/generate` là một lần quét toàn bảng.
→ Bảng tổng hợp `stock_summary(warehouse_id, product_variant_id, total_quantity, …)` cập nhật **tăng dần trong chính transaction đã ghi tồn** (đã có sẵn cột `version` và transaction để làm việc này an toàn).

**⑤ Cache dữ liệu ít thay đổi**
Kho, khu/kệ/ô, danh mục, đơn vị tính gần như tĩnh nhưng đang được tải lại sau mỗi thao tác ([Câu 19](#c19)). Ba mức:
- **React Query / SWR** ở FE (cache + khử trùng request + `staleTime`)
- **HTTP cache header** `ETag` / `Cache-Control` ở BE
- **Redis** cho các truy vấn tổng hợp nếu cần

**⑥ Frontend cho danh sách dài**
- **Ảo hóa dòng (row virtualization)** — chỉ render dòng đang nhìn thấy; `ag-grid-community` đã có trong dự án và hỗ trợ sẵn cả **server-side row model**
- **Debounce ô tìm kiếm** (~300ms) để không bắn request mỗi lần gõ phím
- Tách mã theo route đã có sẵn

**⑦ Vòng đời dữ liệu lịch sử**
`inventory_transactions` và `audit_logs` chỉ tăng, không giảm.
→ **Partition theo tháng trên `created_at`** (đã có sẵn các index `(…, created_at)`) và chuyển dữ liệu cũ hơn 1–2 năm sang bảng lưu trữ.

**⑧ Hạ tầng**
- `DB_CONNECTION_LIMIT` mặc định **10** ([config.ts:45](../backend/src/config/config.ts#L45)) — cần chỉnh theo tải thực và số tiến trình Node
- Thêm **read replica** cho báo cáo/cảnh báo để truy vấn nặng không tranh khóa với nghiệp vụ ghi
- Chạy nhiều tiến trình Node sau load balancer — **lưu ý:** rate limit đang lưu trong `Map` bộ nhớ tiến trình ([rate-limit.middleware.ts:16](../backend/src/common/middleware/rate-limit.middleware.ts#L16)) nên **phải chuyển sang Redis**, nếu không giới hạn sẽ bị nhân lên theo số tiến trình

> 💬 **Câu chốt cho Hội đồng:** *Nút thắt đầu tiên khi mở rộng không phải là ứng dụng mà là **mẫu truy vấn**. Phân trang thật, dùng FULLTEXT thay `LIKE '%…%'`, gộp insert theo lô, và vật chất hóa tồn tổng hợp — bốn thay đổi này giải quyết phần lớn vấn đề mà không cần đổi kiến trúc.*

---

<a id="diem-yeu"></a>
# ⚠️ BA ĐIỂM YẾU NÊN CHỦ ĐỘNG NÊU

> Nói trước thì thành **"hiểu hệ thống của mình"**; bị chỉ ra thì thành **"sót"**.

| # | Điểm yếu | Chi tiết ở |
| :--- | :--- | :--- |
| 1 | `insertAuditLog` chưa điền `request_id` / `ip_address` / `user_agent` dù schema đã có cột và `requestId` đã được sinh sẵn | [Câu 16](#c16) |
| 2 | ENUM khai báo rộng hơn phần đã triển khai — `stock_counts.status` có `REJECTED`/`COMPLETED`/`CANCELLED`, `alerts.alert_type` có 5 loại chưa được sinh | [Câu 6](#c6), [Câu 8](#c8) |
| 3 | `LIMIT 100` cứng ở 28 endpoint, chưa có phân trang | [Câu 20](#c20) |

Ba điểm phụ có thể nêu thêm nếu bị hỏi sâu:
- `bcrypt` cost không thống nhất (10 khi tạo user, 12 khi reset) — [Câu 13](#c13)
- Chưa có `helmet` / CSP — [Câu 15](#c15)
- FE và BE chưa share package type chung — [Câu 2](#c2)

---

<a id="so-do"></a>
# 📊 SƠ ĐỒ KÈM THEO

Tất cả nằm trong [docs/diagrams/](diagrams/), mỗi sơ đồ có sẵn 3–4 định dạng (`.mmd` nguồn Mermaid, `.png`, `.svg`, một số có `.drawio`).

### Theo nhóm câu hỏi

| Nhóm | Sơ đồ liên quan |
| :--- | :--- |
| 🏗️ Kiến trúc | [59 C4 Context](diagrams/59_4-1_so-do-ngu-canh-context-diagram-c4-level-1_flow.png) · [65 C4 Container](diagrams/65_4-7_c4-level-2-container_flow.png) · [66 C4 Component](diagrams/66_4-7_c4-level-3-component_flow.png) · [63 Component](diagrams/63_4-5_so-do-thanh-phan-component-diagram_flow.png) · [64 Deployment](diagrams/64_4-6_so-do-trien-khai-deployment-diagram_flow.png) · [67 Package](diagrams/67_4-8_so-do-goi-package-diagram_flow.png) |
| 📦 Nghiệp vụ kiểm kê | [44 State kiểm kê](diagrams/44_3-3-4_chuc-nang-kiem-ke-stock-count_state.png) · [42 Sequence kiểm kê](diagrams/42_3-3-4_chuc-nang-kiem-ke-stock-count_sequence.png) · [29 Activity kiểm kê](diagrams/29_3-2-3_activity-2-quy-trinh-kiem-ke_flow.png) · [27 Sequence duyệt kiểm kê → sinh phiếu điều chỉnh](diagrams/27_3-2-2_sequence-7-duyet-kiem-ke-sinh-phieu-dieu-chinh_sequence.png) |
| 📦 Nghiệp vụ khác | [02 Nhập kho](diagrams/02_2-4-1_1-quy-trinh-nhap-kho-goods-receipt_flow.png) · [03 Xuất kho](diagrams/03_2-4-1_2-quy-trinh-xuat-kho-goods-issue_flow.png) · [28 Activity FEFO](diagrams/28_3-2-3_activity-1-xac-nhan-phieu-xuat-kho-theo-fefo_flow.png) · [08 Đảo chứng từ](diagrams/08_2-4-1_7-quy-trinh-dao-chung-tu-reverse_flow.png) · [32 Sinh cảnh báo](diagrams/32_3-2-3_activity-5-sinh-canh-bao-va-thong-bao_flow.png) |
| 💾 CSDL | [13 Mức ý niệm](diagrams/13_3-1-1_muc-y-niem-conceptual_flow.png) · [14–20 ERD 7 cụm](diagrams/) · [62 Class diagram](diagrams/62_4-4_so-do-lop-class-diagram-mo-hinh-mien_class.png) · [61 DFD](diagrams/61_4-3_so-do-luong-du-lieu-data-flow-diagram-dfd_flow.png) |
| 🔒 Bảo mật | [07 Xác thực & phân quyền](diagrams/07_2-4-1_6-quy-trinh-xac-thuc-va-phan-quyen_flow.png) · [21 Sequence đăng nhập](diagrams/21_3-2-2_sequence-1-dang-nhap_sequence.png) · [25 Sequence refresh/logout](diagrams/25_3-2-2_sequence-5-lam-moi-token-va-dang-xuat_sequence.png) · [30 Activity phân quyền](diagrams/30_3-2-3_activity-3-phan-quyen-request-bat-ky_flow.png) |
| 🎨 Giao diện | [68 User flow](diagrams/68_4-9_so-do-luong-nguoi-dung-user-flow_flow.png) · [Ảnh chụp màn hình](screenshot/) |

---

## 📚 Tài liệu liên quan trong `docs/`

- [00-100-CAU-HOI-PHAN-BIEN-CHUYEN-SAU.md](00-100-CAU-HOI-PHAN-BIEN-CHUYEN-SAU.md) — bộ 100 câu hỏi rộng hơn
- [00-BANG-TRA-CUU-CODE-NHANH.md](00-BANG-TRA-CUU-CODE-NHANH.md) — bảng tra file + dòng theo tính năng
- [00-QUY-TRINH-LUONG-XU-LY-PROCESS.md](00-QUY-TRINH-LUONG-XU-LY-PROCESS.md) — sơ đồ Mermaid copy thẳng vào slide
- [00-GIAO-TRINH-GIANG-DAY-7-BUOI.md](00-GIAO-TRINH-GIANG-DAY-7-BUOI.md) — giáo trình 7 buổi
- [GIAI-THICH-CAC-TRANG.md](GIAI-THICH-CAC-TRANG.md) — giải thích từng màn hình
