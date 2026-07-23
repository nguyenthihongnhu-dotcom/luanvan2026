# Shared Layer

## Mục tiêu

`shared` chứa code dùng lại nhiều feature. Không đưa logic riêng của một feature vào đây.

## Thành phần chính

```text
config/env.ts
services/httpClient.ts
hooks/useForm.ts
hooks/useDateFormatter.ts
hooks/useNumberFormatter.ts
hooks/useCurrencyFormatter.ts
hooks/useFormatters.ts
ui/Table/TableLayout.tsx
ui/Table/types.ts
```

## httpClient

`shared/services/httpClient.ts` là nơi duy nhất wrap Axios dùng chung.

Nó xử lý:

- Tạo Axios instance với `baseURL = VITE_API_BASE_URL`.
- Gắn bearer token từ sessionStorage bằng request interceptor.
- Trả trực tiếp `response.data` để service nhận đúng wrapper `{ data }` từ backend.
- Convert lỗi Axios thành `HttpError` chung của frontend.
- Giữ helper `unwrapData` cho response `{ data }`.

Feature service nên dùng:

```ts
const response = await httpClient.get<{ data: Row[] }>('/api-path');
return unwrapData(response);
```

## Formatter hooks

Dùng formatter hooks thay vì gọi `toLocaleString` rải rác trong component.

- `useDateFormatter`
- `useNumberFormatter`
- `useCurrencyFormatter`
- `useFormatters`

## Table shared

`TableLayout` render bảng generic. `render` nhận `unknown`, nơi dùng cần cast đúng type.

## Khi thêm shared code

Chỉ đưa vào `shared` nếu:

- Dùng bởi ít nhất 2 feature, hoặc
- Là infrastructure cấp app như HTTP/env/formatter/table.

Không đưa mapper riêng của products/transactions vào shared.