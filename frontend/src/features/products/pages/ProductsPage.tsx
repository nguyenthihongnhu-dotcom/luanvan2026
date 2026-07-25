import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useFormatters } from "@/shared/hooks";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { useSidebar } from "@/app/providers/useSidebar";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { ProductItem } from "@/features/products/hooks/useProducts";
import ProductModal from "@/features/products/components/ProductModal";
import { getProductCategoryLabel, getProductNameLabel, getStockStatusLabel, productCategoryOptions } from "@/features/products/utils/productDisplay";

const statusOptions: Array<ProductItem["status"]> = ["In Stock", "Low Stock", "Out of Stock"];
function escapeHtml(value: string): string {
    return value.replace(/[&<>"]/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
    })[char] ?? char);
}

export default function ProductsPage() {
    const { setExtraContent } = useSidebar();
    const { formatDate, formatNumber } = useFormatters();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    const {
        products,
        locationOptions,
        showModal,
        setShowModal,
        editingProduct,
        setEditingProduct,
        formData,
        handleInputChange,
        resetForm,
        handleSubmit,
        handleEdit,
        handleDelete,
        isLoading,
        error,
    } = useProducts();

    useEffect(() => {
        setExtraContent(
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Danh mục</label>
                    <select
                        className="w-full text-sm border-gray-200 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">Tất cả</option>
                        {productCategoryOptions.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Trạng thái kho</label>
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                            <input type="radio" name="status" checked={filterStatus === "All"} onChange={() => setFilterStatus("All")} className="text-pink-600 focus:ring-pink-500" />
                            <span>Tất cả</span>
                        </label>
                        {statusOptions.map((status) => (
                            <label key={status} className="flex items-center space-x-2 text-sm text-gray-600">
                                <input type="radio" name="status" checked={filterStatus === status} onChange={() => setFilterStatus(status)} className="text-pink-600 focus:ring-pink-500" />
                                <span>{getStockStatusLabel(status)}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [filterCategory, filterStatus, setExtraContent]);


    const handlePrintProductQr = async (product: ProductItem) => {
        const displayName = getProductNameLabel(product.name);
        const payload = JSON.stringify({
            type: "PRODUCT_VARIANT",
            id: product.id,
            sku: product.sku,
            name: displayName,
            category: getProductCategoryLabel(product.category),
        });
        const qrDataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 180 });
        const printWindow = window.open("", "_blank", "width=480,height=620");
        if (!printWindow) {
            window.alert("Trinh duyet dang chan cua so in. Vui long cho phep popup roi thu lai.");
            return;
        }

        const safeSku = escapeHtml(product.sku);
        const safeName = escapeHtml(displayName);
        const safeCategory = escapeHtml(getProductCategoryLabel(product.category));

        printWindow.document.write(`
            <!doctype html>
            <html lang="vi">
                <head>
                    <meta charset="utf-8" />
                    <title>QR san pham ${safeSku}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                        .label { border: 2px solid #111827; padding: 20px; width: 340px; }
                        .sku { font-size: 26px; font-weight: 800; letter-spacing: .5px; }
                        .name { margin-top: 8px; font-size: 15px; font-weight: 700; }
                        .meta { margin-top: 6px; font-size: 12px; color: #4b5563; }
                        .qr { display: block; margin-top: 18px; width: 180px; height: 180px; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="sku">${safeSku}</div>
                        <div class="name">${safeName}</div>
                        <div class="meta">Danh muc: ${safeCategory}</div>
                        <div class="meta">ID san pham: #${product.id}</div>
                        <img class="qr" src="${qrDataUrl}" alt="QR ${safeSku}" />
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };
    const columns: ColumnProps<ProductItem>[] = [
        { key: "id", title: "ID" },
        { key: "sku", title: "SKU" },
        { key: "name", title: "Tên sản phẩm", render: (value) => getProductNameLabel(value) },
        { key: "category", title: "Danh mục", render: (value) => getProductCategoryLabel(value) },
        { key: "stock", title: "Số lượng tồn kho", render: (value) => formatNumber(value as number) },
        { key: "minStock", title: "Tồn kho tối thiểu", render: (value) => formatNumber(value as number) },
        { key: "expiryDate", title: "Hạn sử dụng", render: (value) => formatDate(value as string) },
        {
            key: "status",
            title: "Trạng thái",
            render: (_, record: ProductItem) => {
                const styles = {
                    "In Stock": "bg-green-50 text-green-700 border-green-200",
                    "Low Stock": "bg-yellow-50 text-yellow-700 border-yellow-200",
                    "Out of Stock": "bg-red-50 text-red-700 border-red-200",
                };

                return (
                    <span className={"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border " + styles[record.status]}>
                        {getStockStatusLabel(record.status)}
                    </span>
                );
            },
        },
        {
            key: "locations",
            title: "Vị trí",
            render: (value) => {
                const locations = String(value ?? "").split(",").map((location) => location.trim()).filter(Boolean);

                if (locations.length === 0) {
                    return <span className="text-xs text-slate-400">Chưa có</span>;
                }

                return (
                    <div className="flex max-w-56 flex-wrap gap-1">
                        {locations.map((location) => (
                            <span key={location} className="rounded border border-pink-200 bg-pink-50 px-1.5 py-0.5 text-xs font-semibold text-pink-700">
                                {location}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            key: "actions",
            title: "Thao tác",
            className: "text-right",
            render: (_, record: ProductItem) => (
                <div className="flex justify-end space-x-2">
                    <button onClick={() => void handlePrintProductQr(record)} className="text-pink-600 hover:text-pink-900 text-xs font-medium">In QR</button>
                    <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-900 text-xs font-medium">Sửa</button>
                    <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900 text-xs font-medium">Xóa</button>
                </div>
            ),
        },
    ];

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredProducts = products.filter((product) => {
        const displayName = getProductNameLabel(product.name).toLowerCase();
        const displayCategory = getProductCategoryLabel(product.category);
        return (
            (searchTerm === "" || displayName.includes(normalizedSearch) || product.sku.toLowerCase().includes(normalizedSearch)) &&
            (filterCategory === "All" || displayCategory === filterCategory) &&
            (filterStatus === "All" || product.status === filterStatus)
        );
    });

    const renderStatusBadge = (status: ProductItem["status"]) => {
        const styles = {
            "In Stock": "bg-green-50 text-green-700 border-green-200",
            "Low Stock": "bg-yellow-50 text-yellow-700 border-yellow-200",
            "Out of Stock": "bg-red-50 text-red-700 border-red-200",
        };

        return (
            <span className={"inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium " + styles[status]}>
                {getStockStatusLabel(status)}
            </span>
        );
    };

    const getProductLocations = (product: ProductItem) =>
        String(product.locations ?? "").split(",").map((location) => location.trim()).filter(Boolean);
    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-bold leading-tight text-gray-800">Danh mục sản phẩm Mẹ & Bé</h1>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="w-full rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 sm:w-auto">
                        + Thêm sản phẩm
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc SKU..."
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="md:hidden">
                    {isLoading ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm font-medium text-slate-500">
                            Dang tai du lieu kho...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center">
                            <div className="text-sm font-semibold text-slate-600">Khong co du lieu</div>
                            <div className="mt-1 text-xs text-slate-400">Thu thay doi bo loc hoac them san pham moi</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredProducts.map((product) => {
                                const locations = getProductLocations(product);
                                return (
                                    <article key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="break-words text-xs font-semibold uppercase text-pink-600">{product.sku}</div>
                                                <div className="mt-1 break-words text-base font-bold leading-snug text-slate-900">
                                                    {getProductNameLabel(product.name)}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500">{getProductCategoryLabel(product.category)}</div>
                                            </div>
                                            <div className="shrink-0">{renderStatusBadge(product.status)}</div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-xs font-semibold uppercase text-slate-400">Ton kho</div>
                                                <div className="font-semibold text-slate-800">{formatNumber(product.stock)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold uppercase text-slate-400">Toi thieu</div>
                                                <div className="font-semibold text-slate-800">{formatNumber(product.minStock)}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs font-semibold uppercase text-slate-400">Han su dung</div>
                                                <div className="font-semibold text-slate-800">{formatDate(product.expiryDate)}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-xs font-semibold uppercase text-slate-400">Vi tri kho</div>
                                            {locations.length === 0 ? (
                                                <div className="mt-1 text-sm text-slate-400">Chua co</div>
                                            ) : (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {locations.map((location) => (
                                                        <span key={location} className="rounded border border-pink-200 bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-700">
                                                            {location}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            <button onClick={() => void handlePrintProductQr(product)} className="rounded-md border border-pink-200 px-2 py-2 text-xs font-semibold text-pink-700">
                                                In QR
                                            </button>
                                            <button onClick={() => handleEdit(product)} className="rounded-md border border-blue-200 px-2 py-2 text-xs font-semibold text-blue-700">
                                                Sua
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="rounded-md border border-red-200 px-2 py-2 text-xs font-semibold text-red-700">
                                                Xoa
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Tablelayout className="hidden md:block" columns={columns} dataSource={filteredProducts} rowKey="id" isLoading={isLoading} />
            </div>

            {showModal && createPortal(
                <ProductModal
                    editingProduct={editingProduct}
                    formData={formData}
                    locationOptions={locationOptions}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                />,
                document.body
            )}
        </DashboardLayout>
    );
}
