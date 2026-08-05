# Batches Feature

## Muc tieu nghiep vu

Module `batches` hien thi danh sach lo hang (product batch) duoc tao tu dong khi xac nhan phieu nhap. Moi lo gan voi 1 san pham, 1 nha cung cap va co han su dung (neu co). Day la man read-only.

## Doc code theo thu tu

1. `services/batchService.ts`: goi GET /batches, map sang BatchItem.
2. `pages/BatchesPage.tsx`: hien thi bang, filter theo tu khoa va han su dung.

## API su dung

| Method | Path | Mo ta |
|---|---|---|
| GET | `/batches` | Danh sach lo hang (filter: search, near_expiry) |

## Nguon goc lo hang

- Lo hang duoc tao tu dong khi `POST /goods-receipts/:id/confirm`.
- Moi lan confirm phieu nhap tao 1 lo rieng biet.
- Khong the tao lo thu cong tu frontend.

## Nguyen tac FEFO

Khi xuat hang, he thong uu tien lo nao gan het han nhat truoc (First Expired First Out). Lo hang la co so de FEFO hoat dong chinh xac.

## Luu y

- Han su dung co the null neu san pham khong co expiry.
- Lo co so luong 0 van con trong DB de truy vet lich su.
