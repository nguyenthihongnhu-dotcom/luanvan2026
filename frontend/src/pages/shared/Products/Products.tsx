import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../../../layout/Dashboardlayout";
import Tablelayout from "../../../components/Table/Tablelayout";
import type { ColumnProps } from "../../../components/Table/types";
import { useSidebar } from "../../../context/Sidebarcontext";
import { useProducts } from "../../../hooks/useProducts";
import type { ProductItem } from "../../../hooks/useProducts";
import ProductModal from "./components/ProductModal";

export default function ProductsPage() {
    const { setExtraContent } = useSidebar();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    const {
        products,
        showModal,
        setShowModal,
        editingProduct,
        formData,
        handleInputChange,
        resetForm,
        handleSubmit,
        handleEdit,
        handleDelete,
    } = useProducts();

    useEffect(() => {
        setExtraContent(
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Danh mục</label>
                    <select
                        className="w-full text-sm border-gray-200 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">Tất cả</option>
                        <option value="Bỉm tã">Bỉm tã</option>
                        <option value="Sữa công thức">Sữa công thức</option>
                        <option value="Đồ sơ sinh">Đồ sơ sinh</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Trạng thái kho</label>
                    <div className="space-y-2">
                        {["All", "In Stock", "Low Stock", "Out of Stock"].map(status => (
                            <label key={status} className="flex items-center space-x-2 text-sm text-gray-600">
                                <input type="radio" name="status" checked={filterStatus === status} onChange={() => setFilterStatus(status)} className="text-pink-600 focus:ring-pink-500" />
                                <span>{status === "All" ? "Tất cả" : status}</span>
                            </label>
                        ))}
                    </div>
                    {/* <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Tìm kiếm</label>
                        <input  type="text" placeholder="Tìm kiếm theo tên hoặc SKU..." className="w-full text-sm border-gray-200 rounded-md focus:ring-pink-500 focus:border-pink-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div> */}
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, filterStatus]);

    const columns: ColumnProps<ProductItem>[] = [
        { key: "id", title: "ID" },
        { key: "sku", title: "SKU" },
        { key: "name", title: "Tên sản phẩm" },
        { key: "category", title: "Danh mục" },
        { key: "stock", title: "Số lượng tồn kho" },
        { key: "minStock", title: "Tồn kho tối thiểu" },
        { key: "expiryDate", title: "Hạn sử dụng" },
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
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${styles[record.status]}`}>
                        {record.status}
                    </span>
                );
            },
        },
        {
            key: "actions",
            title: "Thao tác",
            className: "text-right",
            render: (_, record: ProductItem) => (
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                    >
                        Sửa
                    </button>
                    <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900 text-xs font-medium"
                    >
                        Xóa
                    </button>
                </div>
            ),
        },
        { key: "locations", title: "Vị trí" },
    ];

    const filteredProducts = products.filter(p =>
        (searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterCategory === "All" || p.category === filterCategory) &&
        (filterStatus === "All" || p.status === filterStatus)
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Danh mục sản phẩm Mẹ & Bé</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors">
                        + Thêm sản phẩm
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="text" placeholder="Tìm kiếm theo tên hoặc SKU..."
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Tablelayout
                    columns={columns}
                    dataSource={filteredProducts}
                    rowKey="id"
                />
            </div>

            {/* Modal Thêm/Sửa Sản Phẩm */}
            {showModal && createPortal(
                <ProductModal
                    editingProduct={editingProduct}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    onClose={() => {
                        setShowModal(false);
                    }}
                />,
                document.body
            )}
        </DashboardLayout>
    );
}