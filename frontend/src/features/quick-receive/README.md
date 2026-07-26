# Quick Receive Feature

## Route

`/quick-receive`

## Mục đích

Nhập hàng nhanh vào một vị trí kho bằng QR sản phẩm/SKU, QR vị trí kho và số lượng.

## Luồng UI

1. Nhân viên quét hoặc nhập `QR sản phẩm / SKU`.
2. Nhân viên quét hoặc nhập `QR vị trí kho / mã vị trí`.
3. Nhập số lượng, lô hàng, hạn dùng và ghi chú nếu có.
4. Bấm `Xác nhận nhập kho`.
5. Backend tăng tồn tại `stock_locations` và ghi kết quả giao dịch.

## Camera QR

- Mỗi ô QR có nút `Bật cam`.
- UI dùng `navigator.mediaDevices.getUserMedia` để mở camera.
- UI dùng `BarcodeDetector` native để đọc `qr_code`, `code_128`, `ean_13`.
- Khi đọc được mã, UI tự điền vào đúng field, tắt camera và focus sang field tiếp theo.
- Nếu browser không hỗ trợ `BarcodeDetector`, UI hiển thị thông báo và vẫn cho nhập thủ công.

## Product Missing Flow

Nếu backend trả `PRODUCT_NOT_FOUND`, UI mở form tạo nhanh sản phẩm. Sau khi tạo xong, SKU được đưa lại vào form nhập nhanh để tiếp tục thao tác.

## Lưu ý

- Camera cần HTTPS hoặc localhost để browser cấp quyền.
- BarcodeDetector chưa được hỗ trợ đồng đều trên mọi browser; Chrome/Edge mới là lựa chọn ổn nhất với implementation hiện tại.