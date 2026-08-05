# Locations Feature

## Muc tieu nghiep vu

Module `locations` quan ly so do vat ly cua kho: Kho -> Khu -> Ke -> Tang ke -> Vi tri. La nen tang cho tat ca hoat dong nhap/xuat/chuyen/kiem ke.

## Doc code theo thu tu

1. `services/warehouseService.ts`: goi API quan ly khu, ke, vi tri, lich su vi tri.
2. `hooks/useWarehouse.ts`: custom hook tai du lieu kho, zone, shelf, location; xu ly loading/error.
3. `pages/LocationsPage.tsx`: trang chinh, render so do + sidebar.
4. `components/WarehouseGrid.tsx`: hien thi grid 2D dang ban do.
5. `components/WarehouseGridMap.tsx`: render cell khu/ke tren grid.
6. `components/WarehouseGridEditor.tsx`: che do chinh sua so do.
7. `components/StructureSidebar.tsx`: sidebar cay cau truc Kho > Khu > Ke.
8. `components/LocationDetailSidebar.tsx`: sidebar chi tiet vi tri + lich su ton.
9. `components/ZoneSelector.tsx`: chon khu de hien thi tren grid.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/locations` | Danh sach vi tri co ton va lich su |
| POST | `/locations/zones` | Tao khu moi |
| POST | `/locations/shelves` | Tao ke moi trong khu |
| DELETE | `/locations/shelf/:id` | Xoa ke (neu khong co ton) |
| DELETE | `/locations/layer` | Xoa tang ke |

## Phan cap

```
Warehouse
 -> Zone (Khu)
    -> Shelf (Ke)
       -> Layer (Tang ke)
          -> Location (Vi tri)
```

## Luu y

- Phai tao Kho truoc (qua /warehouses), sau do moi tao Khu/Ke o day.
- Xoa ke chi duoc neu khong co ton kho tai ke do.
- WarehouseGrid dung gridOrientation (HORIZONTAL/VERTICAL) de xac dinh huong grid.
