# Catalog Module

## Mục tiêu nghiệp vụ

Module `catalog` quản lý danh mục hàng hóa và SKU. Frontend màn Hàng hóa/Danh mục gọi module này cho dữ liệu thật.

## Đọc code theo thứ tự

1. `catalog.routes.ts`: endpoint category/product CRUD.
2. `catalog.validation.ts`: input được FE phép gửi.
3. `catalog.controller.ts`: map request sang service.
4. `catalog.service.ts`: service mỏng, giữ boundary business cho catalog.
5. `catalog.repository.ts`: phần quan trọng nhất, query/tạo product + variant + stock ban đầu.
6. `catalog.model.ts`: type `CatalogRow`, `CategoryInput`, `ProductInput`.

## Endpoint hiện có

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/catalog` | Catalog tổng hợp |
| GET | `/catalog/categories` | Danh sách danh mục |
| POST | `/catalog/categories` | Tạo danh mục |
| PUT | `/catalog/categories/:id` | Sửa danh mục |
| DELETE | `/catalog/categories/:id` | Soft delete danh mục |
| GET | `/catalog/products` | Danh sách sản phẩm |
| POST | `/catalog/products` | Tạo sản phẩm/SKU |
| PUT | `/catalog/products/:id` | Sửa sản phẩm/SKU |
| DELETE | `/catalog/products/:id` | Soft delete sản phẩm/SKU |

## Mô hình dữ liệu cần hiểu

```text
categories
  -> products
    -> product_variants
      -> product_batches
      -> stock_locations
```

- `products`: tên sản phẩm, danh mục, brand/unit mặc định.
- `product_variants`: SKU bán/nhập thực tế.
- `product_batches`: lô và hạn sử dụng.
- `stock_locations`: số lượng tồn theo SKU + vị trí + lô.

## Luồng tạo sản phẩm từ frontend

```text
POST /catalog/products
  -> parseProductInput
  -> createProduct
  -> insertProduct transaction
      -> tìm/tạo category phù hợp
      -> insert products
      -> insert product_variants với sku
      -> nếu có stock > 0:
          -> tạo batch nếu có expiryDate
          -> lấy location active đầu tiên
          -> insert stock_locations
```

## Khi sửa module này

- Không thêm cột tồn trực tiếp vào `products`; tồn phải đi qua `stock_locations`/report.
- Nếu xóa product/category, ưu tiên soft delete.
- Nếu thêm field FE gửi lên, cập nhật đủ `model -> validation -> repository -> frontend service`.
- Nếu thay SKU/variant logic, kiểm tra các module stock/goods issue vì chúng phụ thuộc `product_variant_id`.