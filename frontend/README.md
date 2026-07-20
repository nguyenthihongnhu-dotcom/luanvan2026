# Frontend - Bambi WMS

Frontend là web app quản lý kho Bambi WMS, dùng React + TypeScript + Vite. App đi theo kiến trúc feature-first: page không gọi API trực tiếp, mà đi qua hook/service của feature.

## Đọc docs ở đâu

- [Frontend overview](docs/overview.md)
- [Guide đọc code cho intern](docs/intern-code-guide.md)
- Docs từng feature: `src/features/<feature>/README.md`

## Chạy frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`.env` tối thiểu:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Kiểm tra

```bash
npx tsc -b
npm run build
npm run lint
```

## Thứ tự hiểu frontend nhanh

1. `src/main.tsx`, `src/app/App.tsx`, `src/app/providers/AppProviders.tsx`
2. `src/app/router/AppRouter.tsx`
3. `src/shared/config/env.ts`, `src/shared/services/httpClient.ts`
4. `src/features/auth`
5. `src/layouts/dashboard`
6. Feature nghiệp vụ: products, locations, transactions, partners, staff

## Feature hiện có

| Feature | Route | Backend API chính | Docs |
| --- | --- | --- | --- |
| Auth | `/login` | `/auth/login` | [README](src/features/auth/README.md) |
| Products | `/products`, `/categories` | `/reports/*`, `/catalog/*` | [README](src/features/products/README.md) |
| Locations | `/locations` | `/locations/*` | [README](src/features/locations/README.md) |
| Transactions | `/transactions` | `/goods-receipts`, `/goods-issues`, `/stock-adjustments` | [README](src/features/transactions/README.md) |
| Partners | `/partners` | `/suppliers` | [README](src/features/partners/README.md) |
| Staff | `/employees` | `/auth/users` | [README](src/features/staff/README.md) |

## Quy tắc code frontend

- Component/page không gọi `fetch` trực tiếp.
- API nằm trong `features/<feature>/services` hoặc `shared/services` nếu dùng chung.
- Hook feature giữ UI state, loading/error và handler.
- Page chỉ compose layout, hook và component.
- Text hiển thị cho người dùng phải là tiếng Việt sạch.
- Backend trả tiếng Anh/raw code thì frontend map sang tiếng Việt ở service/util/page.
- Không dùng mock fallback nếu màn đã nối backend thật; lỗi backend phải hiện error rõ.