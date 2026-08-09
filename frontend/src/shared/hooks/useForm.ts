import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';

/**
 * Custom Hook useForm (Generic Hook)
 * Hỗ trợ quản lý dữ liệu đầu vào và trạng thái thay đổi của các biểu mẫu nhập liệu một cách tự động.
 * @param initialState Trạng thái khởi tạo mặc định ban đầu của form
 */
export function useForm<T>(initialState: T) {
    // Trạng thái lưu trữ dữ liệu hiện tại của toàn bộ các trường trong biểu mẫu
    const [formData, setFormData] = useState<T>(initialState);

    /**
     * Hàm lắng nghe sự kiện thay đổi dữ liệu của các phần tử input, select, textarea
     * Tự động trích xuất thuộc tính `name` và giá trị `value` để cập nhật vào `formData`
     */
    const handleInputChange = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const target = e.target;
        // Checkbox mang giá trị ở thuộc tính `checked`, không phải `value`.
        const nextValue =
            target instanceof HTMLInputElement && target.type === "checkbox"
                ? target.checked
                : target.value;
        setFormData((prev) => ({
            ...prev,
            [target.name]: nextValue, // Ghi đè hoặc thêm mới giá trị tương ứng với tên trường input
        }));
    }, []);

    /**
     * Đặt lại toàn bộ dữ liệu biểu mẫu về giá trị trống mặc định ban đầu
     */
    const resetForm = useCallback(() => {
        setFormData(initialState);
    }, [initialState]);

    return {
        formData,
        setFormData,
        handleInputChange,
        resetForm,
    };
}

