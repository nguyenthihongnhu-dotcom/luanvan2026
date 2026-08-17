/**
 * Số lượng trong CSDL là DECIMAL(18,3) nên backend trả về chuỗi kiểu "150.000".
 * Đổ thẳng ra giao diện thì thủ kho đọc thành "150.000" — vừa thừa ba số 0 vừa dễ
 * nhầm với dấu phân cách hàng nghìn. Hàm này bỏ phần thập phân rỗng và vẫn giữ
 * được số lẻ thật (ví dụ 2,5 kg).
 */
export function formatQuantity(value: unknown): string {
    const quantity = Number(value ?? 0);

    if (!Number.isFinite(quantity)) {
        return String(value ?? '');
    }

    return quantity.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

/**
 * Dạng dùng cho ô nhập liệu: chỉ số thuần, không dấu phân cách hàng nghìn, vì
 * <input type="number"> không nhận chuỗi đã định dạng.
 */
export function toQuantityInputValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';

    const quantity = Number(value);
    return Number.isFinite(quantity) ? String(quantity) : String(value);
}
