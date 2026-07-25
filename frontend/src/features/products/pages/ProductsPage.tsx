import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

export default function ProductsPage() {
    const { setExtraContent } = useSidebar();
    const { formatDate, formatNumber } = useFormatters();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    const {
        products,
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

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Danh mục sản phẩm Mẹ & Bé</h1>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors">
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

                <Tablelayout columns={columns} dataSource={filteredProducts} rowKey="id" isLoading={isLoading} />
            </div>

            {showModal && createPortal(
                <ProductModal
                    editingProduct={editingProduct}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                />,
                document.body
            )}
        </DashboardLayout>
    );
}
