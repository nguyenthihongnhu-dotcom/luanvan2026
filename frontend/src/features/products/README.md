# Products & Categories Feature

## Muc tieu nghiep vu

Module `products` quan ly danh muc (Categories) va danh sach hang hoa/san pham (Products/SKUs). Duy tri master data cho hang hoa truoc khi thuc hien nhap/xuat/ton kho.

## Doc code theo thu tu

1. `services/categoryService.ts`: CRUD danh muc (`/catalog/categories`).
2. `services/productService.ts`: CRUD san pham (`/catalog/products`) & xem ton kho/sap het han tu bao cao (`/reports/*`).
3. `services/productDisplay.ts`: cac ham helper map label/category cho UI.
4. `hooks/useProducts.ts`: custom hook quan ly state danh sach san pham, loading, error va refresh logic.
5. `pages/CategoriesPage.tsx`: quan ly danh muc san pham (bang danh sach + modal tao/sua).
6. `pages/ProductsPage.tsx`: quan ly danh sach san pham, tim kiem, loc, va phan trang.
7. `components/ProductModal.tsx`: modal form tao/cap nhat san pham.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/catalog/categories` | Lay danh sach danh muc |
| POST | `/catalog/categories` | Tao danh muc moi |
| PUT | `/catalog/categories/:id` | Cap nhat danh muc |
| DELETE | `/catalog/categories/:id` | Xoa danh muc |
| GET | `/catalog/products` | Lay danh sach san pham |
| POST | `/catalog/products` | Tao san pham moi |
| PUT | `/catalog/products/:id` | Cap nhat san pham |
| DELETE | `/catalog/products/:id` | Xoa san pham |
| GET | `/reports/product-stock` | Lay thong tin ton kho tong hop cua san pham |

## Luu y

- Danh muc chua san pham se khong the xoa (backend tra 409/Error).
- San pham bat buoc phai co SKU va phai thuoc mot danh muc hop le.
