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

`shared/services/httpClient.ts` là nơi duy nhất wrap `fetch` dùng chung.

Nó xử lý:

- Ghép `VITE_API_BASE_URL` với path.
- JSON stringify body.
- Gắn bearer token từ sessionStorage.
- Parse JSON/text response.
- Throw `HttpError` nếu status không OK.
- `unwrapData` cho response `{ data }`.

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