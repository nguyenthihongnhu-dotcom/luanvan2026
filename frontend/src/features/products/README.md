# Products Feature

## Mục tiêu

Feature `products` quản lý màn Hàng hóa và Danh mục sản phẩm.

## Đọc code theo thứ tự

1. `pages/ProductsPage.tsx`: bảng hàng hóa, filter, mở modal.
2. `hooks/useProducts.ts`: state list/form/modal và action create/update/delete.
3. `services/productService.ts`: gọi report/catalog API và map sang `ProductItem`.
4. `components/ProductModal.tsx`: form thêm/sửa sản phẩm.
5. `utils/productDisplay.ts`: map tên/danh mục/trạng thái sang tiếng Việt.
6. `pages/CategoriesPage.tsx`: màn danh mục.
7. `services/categoryService.ts`: CRUD `/catalog/categories`.

## Backend API

| UI | API |
| --- | --- |
| Danh sách hàng hóa | `GET /reports/product-stock`, `GET /reports/near-expiry` |
| Thêm sản phẩm | `POST /catalog/products` |
| Sửa sản phẩm | `PUT /catalog/products/:id` |
| Xóa sản phẩm | `DELETE /catalog/products/:id` |
| Danh mục | `GET/POST/PUT/DELETE /catalog/categories` |

## Luồng list sản phẩm

```text
ProductsPage
  -> useProducts
  -> productService.listProducts
      -> GET /reports/product-stock
      -> GET /reports/near-expiry
      -> merge expiry theo product_variant_id
      -> calculate status: In Stock / Low Stock / Out of Stock
  -> productDisplay map label tiếng Việt
```

## Lưu ý quan trọng

- Backend report trả dữ liệu gần DB, service map sang `ProductItem` cho UI.
- Trạng thái có thể là tiếng Anh/raw enum, UI phải map sang tiếng Việt.
- Không thêm mock fallback ở hook; backend lỗi thì hiện error.
- Tồn kho không update trực tiếp trong UI; service gửi request cho backend.

## Khi sửa feature này

- Thêm field sản phẩm: cập nhật `ProductItem`, modal, `productService`, backend catalog validation.
- Thêm filter: ưu tiên filter backend nếu dữ liệu lớn; local filter chỉ dùng cho UI nhỏ.
- Nếu text bị mojibake, sửa source UTF-8 và kiểm tra bằng scan `rg "Ã|áº|á»" frontend/src`.