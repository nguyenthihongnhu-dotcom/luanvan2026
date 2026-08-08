import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductItem } from "@/features/products/hooks/useProducts";

interface SkuPickerProps {
    products: ProductItem[];
    /** Variant id đang chọn, rỗng nghĩa là chưa chọn sản phẩm nào. */
    value: string;
    onChange: (variantId: string) => void;
    placeholder?: string;
    label?: string;
    id?: string;
}

/**
 * Ô nhập mã SKU có gợi ý, trả về variant id cho phần gọi API.
 *
 * Trước đây màn tồn kho bắt gõ thẳng Variant ID — một con số người dùng không
 * nhìn thấy ở đâu trong kho và không có cách nào tra. Ở đây người dùng gõ mã SKU
 * in trên thùng hàng, danh sách gợi ý lọc dần theo mã và tên, chọn xong mới quy
 * đổi sang id để gửi lên backend.
 */
export default function SkuPicker({
    products,
    value,
    onChange,
    placeholder = "Nhập mã SKU",
    label,
    id,
}: SkuPickerProps) {
    const selected = useMemo(
        () => products.find((product) => String(product.id) === value) ?? null,
        [products, value],
    );

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Chọn xong hoặc bị xóa từ bên ngoài thì ô nhập bám theo giá trị thật.
    useEffect(() => {
        setQuery(selected ? selected.sku : "");
    }, [selected]);

    // Bấm ra ngoài thì đóng gợi ý và trả ô nhập về đúng thứ đang chọn.
    useEffect(() => {
        function onPointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery(selected ? selected.sku : "");
            }
        }
        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [selected]);

    const suggestions = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return products.slice(0, 8);
        return products
            .filter((product) =>
                product.sku.toLowerCase().includes(needle) ||
                product.name.toLowerCase().includes(needle))
            .slice(0, 8);
    }, [products, query]);

    function pick(product: ProductItem) {
        onChange(String(product.id));
        setQuery(product.sku);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                    {label}
                </label>
            )}
            <input
                id={id}
                type="text"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                autoComplete="off"
                value={query}
                placeholder={placeholder}
                onFocus={() => setIsOpen(true)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setIsOpen(true);
                    // Gõ lại thì bỏ lựa chọn cũ, tránh cảnh ô hiện mã này mà lọc theo mã khác.
                    if (value) onChange("");
                }}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setIsOpen(false);
                    if (event.key === "Enter" && suggestions.length === 1) {
                        event.preventDefault();
                        pick(suggestions[0]);
                    }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            />

            {selected && !isOpen && (
                <p className="mt-1 truncate text-xs text-gray-500" title={selected.name}>
                    {selected.name}
                </p>
            )}

            {isOpen && (
                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {suggestions.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-gray-500">Không có SKU nào khớp “{query}”</li>
                    ) : (
                        suggestions.map((product) => (
                            <li key={product.id}>
                                <button
                                    type="button"
                                    onClick={() => pick(product)}
                                    className="flex w-full flex-col items-start px-3 py-1.5 text-left hover:bg-pink-50"
                                >
                                    <span className="text-sm font-semibold text-gray-900">{product.sku}</span>
                                    <span className="truncate text-xs text-gray-500">{product.name}</span>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
