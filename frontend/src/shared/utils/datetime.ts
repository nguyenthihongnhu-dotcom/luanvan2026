/**
 * Tiện ích ngày giờ dùng chung cho form và payload gửi backend.
 *
 * Nguyên tắc: mọi giá trị đưa lên API đều là **giờ địa phương** dạng
 * `YYYY-MM-DD` hoặc `YYYY-MM-DD HH:mm:ss`. Không dùng `toISOString()` trực tiếp
 * vì nó quy về UTC: ở GMT+7 các mốc đầu ngày và cuối ngày sẽ lệch mất một ngày
 * so với ngày người dùng nhìn thấy trên form.
 */

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

/** `YYYY-MM-DD` theo giờ máy, đúng định dạng của <input type="date">. */
export function toDateInputValue(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Ngày hôm nay theo giờ máy, dạng `YYYY-MM-DD`. */
export function todayInputValue(): string {
    return toDateInputValue(new Date());
}

/**
 * Ghép ngày người dùng chọn với giờ hiện tại thành `YYYY-MM-DD HH:mm:ss` để gửi
 * backend. Ô nhập chỉ có ngày nên phần giờ lấy từ đồng hồ lúc bấm lưu; chọn
 * ngày khác hôm nay thì vẫn giữ giờ hiện tại.
 */
export function withCurrentTime(dateInputValue: string): string | undefined {
    if (!dateInputValue) return undefined;
    const now = new Date();
    return `${dateInputValue} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * Cắt lấy phần ngày từ giá trị thời gian của backend. Cột DATETIME được driver
 * serialize thành chuỗi ISO kết thúc bằng `Z`, nên phải đổi về giờ máy trước
 * khi cắt — cắt thẳng sẽ trả về ngày UTC và lùi một ngày với các mốc buổi tối.
 */
export function toDisplayDate(value: unknown): string {
    if (typeof value !== 'string' || !value) return '';

    if (value.endsWith('Z')) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return toDateInputValue(parsed);
    }

    return value.slice(0, 10);
}
