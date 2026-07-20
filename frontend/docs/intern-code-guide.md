# Frontend Intern Code Guide

Guide này giúp intern đọc frontend nhanh và sửa đúng chỗ.

## 1. Đọc một màn hình theo thứ tự nào?

Ví dụ màn Hàng hóa:

```text
AppRouter.tsx
  -> ProductsPage.tsx
  -> useProducts.ts
  -> productService.ts
  -> httpClient.ts
  -> backend API
  -> productDisplay.ts map text/status
  -> ProductModal.tsx nếu thêm/sửa
  -> TableLayout.tsx render bảng
```

Đừng bắt đầu từ component modal nếu chưa biết page lấy data từ hook/service nào.

## 2. Vai trò từng loại file

### Page

Page là route-level component. Page nên:

- Gọi hook feature.
- Compose layout/component.
- Set sidebar content nếu cần.
- Không gọi `fetch` trực tiếp.
- Không chứa mapper backend DTO phức tạp.

### Hook

Hook feature giữ state và action:

- `data`, `isLoading`, `error`.
- modal open/close.
- form state.
- handler create/update/delete.
- gọi service rồi reload data.

### Service

Service là API adapter:

- Gọi `httpClient`.
- `unwrapData` response backend.
- Map backend DTO sang UI model.
- Map UI input sang backend payload.

Nếu backend trả field tiếng Anh/raw enum, service hoặc util phải map sang model dễ dùng cho UI.

### Component

Component chỉ render UI và gọi callback từ hook/page. Component không tự biết backend endpoint.

### Shared

`shared` chỉ chứa code dùng lại nhiều feature:

- `httpClient`
- `env`
- formatter hooks
- table component
- form hook

Không đưa logic riêng của products/transactions vào shared.

## 3. Cách thêm API cho một màn

Ví dụ thêm sửa đối tác:

1. Backend có endpoint chưa: `PUT /suppliers/:id`.
2. Thêm function trong `partnerService.ts`.
3. Hook/page gọi service, không gọi `httpClient` trực tiếp ở JSX.
4. Sau mutation, reload list từ backend.
5. Hiển thị lỗi nếu request fail.
6. Cập nhật README feature.

Pattern:

```ts
export async function updatePartner(id: number, input: PartnerInput): Promise<void> {
  await httpClient.put(`/suppliers/${id}`, mapPartnerPayload(input));
}
```

## 4. Cách xử lý text tiếng Việt

Frontend phải hiển thị tiếng Việt 100%, kể cả DB/backend trả raw tiếng Anh.

Nơi map hợp lý:

- Status sản phẩm: `products/utils/productDisplay.ts`.
- Loại giao dịch: `TransactionsPage.tsx` hoặc util riêng nếu dùng nhiều nơi.
- Role user: `staff/services/userService.ts`.
- Location status: `locations/services/warehouseService.ts`.

Không sửa DB chỉ để đổi label UI. DB có thể giữ enum tiếng Anh, UI map sang tiếng Việt.

## 5. Cách debug lỗi HTTP request failed

1. Mở Network tab xem endpoint nào fail.
2. Kiểm tra `VITE_API_BASE_URL`.
3. Gọi backend health: `http://localhost:3000/health`.
4. Kiểm tra backend console có lỗi validation/SQL không.
5. Xem service đang gửi payload field đúng backend validation chưa.
6. Nếu 401/403, kiểm tra token trong `sessionStorage` và permission user.
7. Nếu response có `{ error }`, show message thân thiện thay vì chỉ log console.

## 6. Cách đọc feature hiện tại

### Auth

```text
LoginPage -> authService.login -> /auth/login -> AuthProvider.login -> Sidebar/Navbar đọc user
```

Lưu ý: `register` trong `authService.ts` hiện chưa gọi API thật trong code hiện tại.

### Products

```text
ProductsPage -> useProducts -> productService
  -> GET /reports/product-stock
  -> GET /reports/near-expiry
  -> POST/PUT/DELETE /catalog/products
```

### Categories

```text
CategoriesPage -> categoryService -> /catalog/categories
```

### Locations

```text
LocationsPage -> useWarehouse -> warehouseService
  -> GET /locations
  -> POST /locations/zones
  -> POST /locations/shelves
  -> DELETE shelf/layer
```

### Transactions

```text
TransactionsPage -> useTransactions -> transactionService
  -> GET receipts/issues/adjustments
  -> POST receipt/issue/adjustment header
```

### Partners

```text
PartnersPage -> partnerService -> /suppliers
```

### Staff

```text
EmployeesPage -> userService -> /auth/users
```

## 7. Checklist trước khi báo xong

- `npx tsc -b` pass.
- `npm run build` pass nếu thay runtime/build.
- Không còn text mojibake như `Ã`, `áº`, `á»` trong `src`.
- Không có mock fallback ở màn đã nối backend thật.
- API gọi qua service layer.
- Feature README cập nhật nếu đổi endpoint/flow.
- Màn lỗi backend có error state dễ hiểu.