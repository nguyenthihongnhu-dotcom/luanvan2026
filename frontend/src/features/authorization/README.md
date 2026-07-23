# Authorization Feature

## Route

`/authorization`

## Mục đích

Xem role và danh sách permission backend đang gán cho từng role.

## Luồng code

- `pages/AuthorizationPage.tsx`: bảng role/permission, filter search.
- `services/authorizationService.ts`: gọi `GET /authorization`.

## Lưu ý

- Hiện là màn đọc. Backend chưa có endpoint gán/bỏ permission qua UI.
