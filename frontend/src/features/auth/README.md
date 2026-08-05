# Auth Feature

## Muc tieu nghiep vu

Module `auth` quan ly xac thuc nguoi dung: dang nhap, dang ky, luu token, cap quyen truy cap component theo role. Day la foundation ma tat ca cac man hinh khac phu thuoc.

## Doc code theo thu tu

1. `types.ts`: dinh nghia `AuthUser`, `AuthState`, `AuthContextType`.
2. `services/authService.ts`: goi POST /auth/login, POST /auth/register; luu/xoa token sessionStorage.
3. `AuthContext.ts`: React Context khai bao AuthContextType.
4. `AuthProvider.tsx`: cung cap auth state, hydrate tu sessionStorage khi mount.
   - `login()`: goi authService.login, set user vao state.
   - `logout()`: xoa token khoi sessionStorage, reset state.
5. `hooks/useAuth.ts`: consume AuthContext.
6. `pages/LoginPage.tsx`: form dang nhap, goi useAuth().login.
7. `components/RegisterModal.tsx`: modal dang ky, goi authService.register.

## Luu y quan trong

- Token luu trong `sessionStorage` (khong phai localStorage) -- dong tab la het phien.
- `/auth/register` luon tao role STAFF; admin dung `/auth/users` de tao role khac.
- Sau khi duoc cap them quyen, user phai dang xuat va dang nhap lai de token cap nhat.
- Rate limit: 10 lan sai/15 phut theo IP + email.

## Luong dang nhap

```
LoginPage.handleSubmit
  -> useAuth().login(email, password)
  -> authService.login()
  -> POST /auth/login
  -> luu token vao sessionStorage
  -> set AuthContext.user
  -> redirect sang /products
```

## Du lieu phu thuoc

- `sessionStorage["auth_token"]`: JWT access token.
- `sessionStorage["auth_user"]`: JSON serialized user object.
