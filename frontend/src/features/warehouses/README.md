# Warehouses Feature

## Muc tieu nghiep vu

Module `warehouses` quan ly danh sach kho (Warehouse Master Data). La cap cao nhat trong phan cap vi tri kho.

## Doc code theo thu tu

1. `services/warehouseService.ts`: CRUD danh sach kho (`/warehouses`).
2. `pages/WarehousesPage.tsx`: hien thi danh sach kho va modal tao/sua kho.

## API su dung

| Method | Path | Mo ta | Permission |
|---|---|---|---|
| GET | `/warehouses` | Lay danh sach kho | - |
| POST | `/warehouses` | Tao kho moi | `warehouses:create` |
| PUT | `/warehouses/:id` | Cap nhat thong tin kho | `warehouses:update` |
| DELETE | `/warehouses/:id` | Xoa kho | `warehouses:delete` |

