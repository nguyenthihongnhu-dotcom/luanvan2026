# Plan sửa 3 lỗi còn lại của commit `7528b12`

> Bàn giao cho AI agent khác thực hiện. Đọc hết mục 0 trước khi sửa bất cứ file nào.

Commit `7528b12` mang thông điệp *"fix(wms): hoan thien phan tach da kho, dropdown zone kiem ke, mo modal recreat phieu va fallback snapshot"* nhưng 3 trong 4 hạng mục **chưa đạt**, một hạng mục còn có thể làm sai lệch tồn kho. Phần backend `locations.repository.ts` trong commit đó đã đúng, **không đụng vào**.

---

## 0. Bối cảnh và ràng buộc

**Dự án**: Bambi WMS — `backend/` (Express + TypeScript + MySQL, driver `mysql2`), `frontend/` (React + Vite + TypeScript).

**Kết nối CSDL**: đọc `DATABASE_URL` trong `backend/.env` (đang trỏ `localhost:3306/warehouse_management`). Máy **không có `mysql` CLI trong PATH** — muốn chạy SQL thì viết script Node đặt trong `backend/scripts/` rồi `node scripts/<ten>.mjs`, xem mẫu ở `backend/scripts/check-data.mjs`.

**Lệnh kiểm tra bắt buộc chạy trước khi báo xong**:

```bash
cd backend  && npx tsc --noEmit -p tsconfig.json      # bỏ qua lỗi có sẵn trong test/backend.integration-spec.ts
cd backend  && npx jest src/modules                    # phải giữ 22/22 pass
cd frontend && npx tsc --noEmit -p tsconfig.app.json   # phải sạch hoàn toàn
```

**Ràng buộc**:
- Không sửa `backend/src/modules/locations/**` — phần đó vừa được sửa xong và đã kiểm chứng trên DB thật.
- Không đổi lược đồ CSDL. Nếu nghĩ là cần thì dừng lại và hỏi, đừng tự thêm cột.
- Giữ nguyên phong cách code xung quanh: tiếng Việt cho thông điệp người dùng, tiếng Anh cho mã lỗi và tên bảng/cột.
- Mỗi hạng mục dưới đây có mục *Cách kiểm chứng* — phải chạy thật và dán kết quả, không được kết luận bằng suy đoán.

---

## 1. [P0] Gỡ fallback snapshot trong kiểm kê

**File**: `backend/src/modules/stock-counts/stock-counts.repository.ts`, hàm `getSnapshotRows` (dòng ~171), khối fallback dòng ~200–223.

### Hiện trạng sai

Khi phạm vi kiểm kê không có `stock_locations` nào `quantity > 0`, code chạy một query dự phòng lấy **một SKU bất kỳ** rồi `CROSS JOIN` với tối đa 50 vị trí:

```sql
CROSS JOIN (SELECT id FROM product_variants WHERE status = 'ACTIVE' LIMIT 1) pv
```

Chạy thật trên CSDL hiện tại cho kết quả:

| scopeType | Kết quả |
| --- | --- |
| `WAREHOUSE` | 50 dòng, toàn bộ là SKU id=1 (`BIM-HUG-M`) |
| `ZONE` | 50 dòng, cũng chỉ SKU id=1 |
| `SKU` (id=8) | **0 dòng** — bỏ qua chính SKU được chọn |
| `CATEGORY` | **Lỗi SQL**: `Unknown column 'p.category_id' in 'where clause'` |

Ba khuyết điểm:

1. `buildSnapshotScopeWhere` (dòng ~136) sinh điều kiện `p.category_id` cho scope `CATEGORY`, nhưng query fallback **không JOIN bảng `products`** → 500 Internal Server Error.
2. Với scope `SKU`, điều kiện `pv.id = ?` bị so với đúng một SKU do `LIMIT 1` chọn bừa (không `ORDER BY`) → gần như luôn rỗng.
3. **Nghiêm trọng nhất**: 50 dòng đó được ghi vào `stock_count_items` với `system_quantity = 0` cho một SKU vô can. `difference_quantity` là cột sinh (`backend/warehouse_management_mysql.sql:689`), nên nhân viên đếm bất kỳ số nào lớn hơn 0 thì lúc duyệt sẽ sinh `stock_adjustment_items` chiều `IN` — **bơm tồn ảo của SKU đó vào 50 vị trí không liên quan**.

### Việc cần làm

Xóa toàn bộ khối fallback, trả `getSnapshotRows` về đúng một truy vấn như trước:

```ts
async function getSnapshotRows(
  connection: PoolConnection,
  input: CreateStockCountInput,
): Promise<SnapshotStockRow[]> {
  const scope = buildSnapshotScopeWhere(input);
  const [rows] = await connection.query<SnapshotStockRow[]>(/* truy vấn stock_locations như cũ */, scope.params);
  return rows;
}
```

Phạm vi không có tồn thì để nguyên luồng ném `STOCK_COUNT_SNAPSHOT_EMPTY` (dòng ~273) — đây là hành vi **đúng nghiệp vụ**: snapshot kiểm kê phải phản ánh những gì hệ thống tin là đang có, không được bịa dòng.

Kèm theo, cải thiện phía người dùng: bảo đảm mã lỗi `STOCK_COUNT_SNAPSHOT_EMPTY` được frontend hiển thị thành câu dễ hiểu, ví dụ *"Phạm vi đã chọn không có tồn kho nào để kiểm kê. Chọn khu vực hoặc kho khác."* Kiểm tra `frontend/src/features/stock-counts/` xem thông điệp hiện ra thế nào.

> **Nếu nghiệp vụ thật sự cần đếm cả vị trí trống** thì đó là một tính năng riêng, phải liệt kê các SKU **thuộc đúng phạm vi** (theo zone/shelf/category đã chọn), không phải một SKU chọn bừa, và phải bàn trước chứ không tự làm trong lần sửa này.

### Cách kiểm chứng

1. Viết script Node chạy đúng câu SQL của `getSnapshotRows` với cả 5 scope (`WAREHOUSE`, `ZONE`, `SHELF`, `SKU`, `CATEGORY`), xác nhận không câu nào lỗi SQL.
2. Tạo phiếu kiểm kê scope `CATEGORY` trên một danh mục không có tồn → phải nhận lỗi `STOCK_COUNT_SNAPSHOT_EMPTY` với HTTP 422, **không phải 500**.
3. Tạo phiếu kiểm kê scope `ZONE` trên zone có tồn → snapshot phải chỉ chứa đúng SKU thật sự nằm trong zone đó.
4. `npx jest src/modules` vẫn 22/22.

---

## 2. [P1] Dropdown khu vực khi tạo phiếu kiểm kê phải đọc từ CSDL

**File**: `frontend/src/features/stock-counts/pages/StockCountsPage.tsx`, dòng ~279–305.

### Hiện trạng sai

Nhánh `if (formData.scopeType === "ZONE")` hardcode mảng `defaultZones` gồm 5 khu id 1–5. Đối chiếu với CSDL thật:

| Dropdown hiển thị | Thực tế trong CSDL |
| --- | --- |
| id 2 "Khu B - Đồ chơi và xe đẩy" | id 2 = "Khu B - **Tã và vệ sinh**" |
| id 3 "Khu C - Thời trang trẻ em" | id 3 = "Khu C - **Đồ sơ sinh**" |
| id 4 "Khu D - Thực phẩm ăn dặm" | id 4 = Khu **A của KHO-HCM-02** — thuộc kho khác |
| id 5 "Khu E - Chăm sóc sức khỏe" | **không tồn tại** |
| (không có) | Khu D thật là id 14, khu E thật là id 13 |

Hậu quả: chọn "Khu D" khi đang thao tác ở kho HCM-01 sẽ kiểm kê nhầm khu của kho HCM-02 — phá đúng cái "phân tách đa kho" mà commit tự nhận đã hoàn thiện. Khu D và E thật thì không chọn được.

### Việc cần làm

Dùng API đã có sẵn: `GET /locations/zones?warehouseId=<id>` (khai báo ở `backend/src/modules/locations/locations.routes.ts`, service phía frontend là `listZones` trong `frontend/src/features/locations/services/warehouseService.ts`, trả về `WarehouseZone[]` gồm `id`, `code`, `name`, `shelfCount`, `locationCount`).

Các bước:

1. Xóa hẳn mảng `defaultZones`.
2. Nạp zone theo **kho đang chọn trong form** (`formData` đang giữ kho nào thì truyền `warehouseId` đó). Nếu form chưa có trường chọn kho thì phải thêm, vì zone luôn thuộc về một kho cụ thể.
3. Nạp lại danh sách zone mỗi khi người dùng đổi kho; đổi kho phải xóa `scopeReferenceId` đang chọn để tránh giữ lại id của kho cũ.
4. Xử lý đủ trạng thái: đang tải, lỗi tải, và **kho chưa có khu nào** (hiện câu gợi ý sang trang Vị trí kho tạo khu trước, không hiện danh sách rỗng im lặng).
5. Hiển thị `code` và `name` thật, ví dụ `A — Khu A - Sữa và bột ăn dặm`; `value` của option là `zone.id` thật.

Rà thêm các scope khác trong `getScopeReferenceConfig` (dòng ~61): nếu `SHELF`, `LOCATION`, `SKU`, `CATEGORY` cũng đang bắt người dùng gõ tay id thì ghi nhận lại thành một mục việc riêng, **đừng tự mở rộng phạm vi lần sửa này**.

### Cách kiểm chứng

1. Mở form tạo phiếu kiểm kê, chọn kho HCM-01 → dropdown phải hiện đúng 5 khu A, B, C, E, D với tên khớp CSDL.
2. Đổi sang kho HCM-02 → dropdown chỉ còn 1 khu A (id 4), và lựa chọn cũ bị xóa.
3. Tạo phiếu kiểm kê scope ZONE trên khu E (id 13) → phiếu tạo được, `scope_reference_id` trong CSDL đúng bằng 13.
4. `npx tsc --noEmit -p tsconfig.app.json` sạch.

---

## 3. [P2] Sửa luồng "Thêm lại phiếu" làm lẫn dữ liệu giữa hai phiếu

**File**: `frontend/src/features/transactions/hooks/useTransactions.ts`, hàm `handleRecreateTransaction` (dòng ~229–277).

### Hiện trạng sai

Commit đổi từ `setItems(mapped.length > 0 ? mapped : [makeEmptyItem()])` sang:

```ts
if (detail.items && detail.items.length > 0) {
    setItems(detail.items.map(...));
}
```

Ba vấn đề:

1. **Không reset `items`**: `handleRecreateTransaction` không gọi `resetTransactionForm()` (dòng ~127). Khi tạo lại từ một phiếu **không có dòng hàng nào**, form giữ nguyên dòng hàng của phiếu thao tác trước đó → người dùng vô tình tạo phiếu mới mang dòng hàng của phiếu khác. Phiếu rỗng có thật trong hệ thống (trước khi vá dữ liệu thì `PN-202607-003` và `CK-202607-002` đều 0 dòng).
2. **Bịa số lượng**: `quantity: item.quantity ? String(item.quantity) : '1'` — dữ liệu gốc rỗng thì điền đại số 1. Bản cũ để chuỗi rỗng cho người dùng tự nhập, như vậy đúng hơn.
3. **Mất `setEditingTransaction(null)`**: hiện chưa gây lỗi vì không nơi nào gán `editingTransaction` khác `null`, nhưng nhánh `else` của `handleSubmit` (dòng ~169–174) chỉ `setData()` cục bộ **chứ không gọi API** — nếu sau này có code gán giá trị cho nó thì bấm Lưu sẽ không xuống CSDL.

### Việc cần làm

1. Luôn đặt lại danh sách dòng hàng: có dòng thì map từ `detail.items`, không có thì `[makeEmptyItem()]`.
2. Trả `quantity` về `String(item.quantity ?? '')`, không thay bằng `'1'`.
3. Gọi lại `setEditingTransaction(null)` trước `setShowModal(true)` để modal chắc chắn ở chế độ tạo mới (tiêu đề modal phụ thuộc giá trị này — xem `TransactionModal.tsx:96`).
4. Nhân tiện ghi chú lại nhánh `else` của `handleSubmit` chỉ cập nhật state cục bộ: **ghi thành một mục việc riêng, không tự sửa** trong lần này vì nó đụng luồng chỉnh sửa chứng từ.

### Cách kiểm chứng

1. Mở một phiếu có dòng hàng → "Thêm lại phiếu" → form hiện đúng dòng hàng của phiếu đó, số lượng đúng.
2. Ngay sau đó đóng modal, mở một phiếu **không có dòng hàng** → "Thêm lại phiếu" → form phải chỉ còn **một dòng trống**, không sót dòng của phiếu trước.
3. Tiêu đề modal luôn là "Thêm giao dịch mới", không phải "Chỉnh sửa giao dịch".
4. `npx tsc --noEmit -p tsconfig.app.json` sạch.

---

## 4. Báo cáo kết quả

Khi xong, báo cáo theo đúng khuôn sau, **không tự nhận đã sửa nếu chưa chạy kiểm chứng**:

- Mỗi hạng mục: file đã đổi, tóm tắt thay đổi, kết quả từng bước *Cách kiểm chứng* (dán output thật).
- Kết quả 3 lệnh kiểm tra ở mục 0.
- Danh sách mục việc phát sinh đã ghi nhận mà **cố ý chưa làm** (nhánh `else` của `handleSubmit`, các scope còn bắt gõ tay id, tính năng đếm vị trí trống nếu nghiệp vụ cần).
- Bất cứ chỗ nào không kiểm chứng được thì nói rõ là chưa kiểm chứng, kèm lý do.
