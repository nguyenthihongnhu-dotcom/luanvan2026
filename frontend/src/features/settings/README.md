# Settings Feature

## Muc tieu nghiep vu

Module `settings` quan ly cac thong so cau hinh he thong (VD: nguong ton thap, so ngay canh bao het han, bat/tat FEFO).

## Doc code theo thu tu

1. `services/settingService.ts`: goi GET /settings, PUT /settings/:id, POST /settings/seed.
2. `pages/SettingsPage.tsx`: quan ly va cap nhat gia tri cau hinh duoi dang JSON.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET | `/settings` | Lay danh sach cau hinh | - |
| PUT | `/settings/:id` | Cap nhat cau hinh | `settings:update` |
| POST | `/settings/seed` | Khoi tao cau hinh mac dinh | `settings:update` |

## Luu y

- Gia tri cau hinh (`setting_value`) duoc luu duoi dang JSON/string va phai dung format JSON khi edit.
