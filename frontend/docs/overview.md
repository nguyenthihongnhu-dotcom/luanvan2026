# Frontend Overview - Bambi WMS

Frontend Bambi WMS dùng React + TypeScript + Vite, chia code theo feature nghiệp vụ. File này mô tả thứ tự phụ thuộc và cách các màn gọi backend.

## 1. Kiến trúc luồng dữ liệu

```text
User action
  -> Page component
  -> feature hook
  -> feature service
  -> shared httpClient
  -> backend API
  -> service map DTO sang UI model
  -> hook set state
  -> page render
```

Không đi tắt:

```text
Page -> fetch/backend API
```

## 2. Tầng nền cần hiểu trước

```text
main.tsx
  -> App.tsx
    -> AppProviders.tsx
      -> AuthProvider
      -> SidebarProvider
      -> BrowserRouter
    -> AppRouter.tsx
```

Files quan trọng:

- `src/main.tsx`: entrypoint render React.
- `src/app/App.tsx`: root app.
- `src/app/providers/AppProviders.tsx`: bọc providers.
- `src/app/router/AppRouter.tsx`: định nghĩa route.
- `src/shared/config/env.ts`: đọc `VITE_API_BASE_URL`.
- `src/shared/services/httpClient.ts`: wrapper fetch, token, error, unwrap response.

## 3. Thứ tự đọc feature

Đọc theo dependency này để hiểu dự án nhanh:

```text
Foundation
  app, router, providers, shared httpClient, shared hooks, table

Auth
  auth context -> auth service -> login page/register modal

Layout
  dashboard layout -> navbar -> sidebar -> sidebar dynamic content

Master Data Screens
  products/categories -> catalog/reports API
  locations -> locations API
  partners -> suppliers API
  staff -> auth/users API

Operation Screens
  transactions -> goods receipts/issues/adjustments API
```

Vì sao thứ tự này quan trọng:

- Không hiểu `httpClient` thì khó biết API lỗi ở đâu.
- Không hiểu `AuthProvider` thì khó biết token được lưu/gửi thế nào.
- Không hiểu layout/sidebar thì dễ nhét filter sai chỗ.
- Products/locations là data nền cho transactions.
- Transactions là màn tổng hợp nhiều loại chứng từ backend.

## 4. Route map

| Route | Page | Feature | Ý nghĩa |
| --- | --- | --- | --- |
| `/` | redirect `/products` | router | Mặc định vào hàng hóa |
| `/login` | `LoginPage` | auth | Đăng nhập |
| `/dashboard` | `ProductsPage` | products | Alias dashboard hiện tại |
| `/products` | `ProductsPage` | products | Hàng hóa |
| `/categories` | `CategoriesPage` | products | Danh mục |
| `/locations` | `LocationsPage` | locations | Sơ đồ kho |
| `/transactions` | `TransactionsPage` | transactions | Giao dịch kho |
| `/partners` | `PartnersPage` | partners | Đối tác/nhà cung cấp |
| `/employees` | `EmployeesPage` | staff | Nhân viên |

## 5. API map

| Feature | Service | Backend API |
| --- | --- | --- |
| auth | `authService.ts` | `POST /auth/login`; register hiện chưa gọi API trong code hiện tại |
| products | `productService.ts` | `GET /reports/product-stock`, `GET /reports/near-expiry`, `POST/PUT/DELETE /catalog/products` |
| products/categories | `categoryService.ts` | `GET/POST/PUT/DELETE /catalog/categories` |
| locations | `warehouseService.ts` | `GET /locations`, `POST /locations`, `POST /locations/zones`, `POST /locations/shelves`, `DELETE /locations/shelf/:id`, `DELETE /locations/layer` |
| transactions | `transactionService.ts` | `GET /goods-receipts`, `GET /goods-issues`, `GET /stock-adjustments`, `POST /goods-receipts`, `POST /goods-issues`, `POST /stock-adjustments` |
| partners | `partnerService.ts` | `GET/POST/PUT/DELETE /suppliers` |
| staff | `userService.ts` | `GET /auth/users` |

## 6. Response và error handling

Backend trả wrapper:

```json
{
  "data": []
}
```

Frontend dùng:

```ts
const response = await httpClient.get<{ data: Row[] }>('/path');
return unwrapData(response);
```

`httpClient` sẽ:

- Ghép base URL từ `VITE_API_BASE_URL`.
- Gắn `Authorization: Bearer <token>` nếu có token trong `sessionStorage`.
- JSON stringify body.
- Throw `HttpError` nếu response không OK.

## 7. Thứ tự debug màn hình trống

1. Backend chạy chưa: `GET http://localhost:3000/health`.
2. Frontend `.env` đúng `VITE_API_BASE_URL` chưa.
3. Network tab gọi đúng endpoint chưa.
4. Service có unwrap đúng `{ data }` không.
5. Service mapper có map đúng field backend sang UI model không.
6. Hook có set `error`/`data` đúng không.
7. Page có render loading/error/empty state không.
8. Text có bị raw code/tiếng Anh/mojibake không.

## 8. Khi thêm feature mới

1. Tạo `src/features/<feature>/README.md` trước hoặc cùng lúc với code.
2. Tạo `pages`, `services`, `hooks`, `components` theo nhu cầu.
3. Thêm route trong `AppRouter.tsx`.
4. Thêm menu trong `layouts/dashboard/Navbar.tsx` nếu cần.
5. Không gọi API trực tiếp trong page.
6. Cập nhật `frontend/docs/overview.md` nếu thêm route/API chính.
## 9. Backend module còn thiếu UI

Xem chi tiết tại [Backend UI Gap](backend-ui-gap.md). File đó là checklist để biết backend module nào đã có giao diện, module nào còn thiếu route/màn hình, và nên triển khai theo ưu tiên nào.