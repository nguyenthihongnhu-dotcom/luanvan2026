import React, { useEffect, useState } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import OrderModal from "@/features/orders/components/OrderModal";

import {
    orderService,
    type Order,
    type OrderStatus,
} from "@/features/orders/services/orderService";

import {
    warehouseService,
    type WarehouseOption,
} from "@/features/warehouses/services/warehouseService";

import {
    productService,
} from "@/features/products/services/productService";

import type { ProductItem } from "@/features/products/hooks/useProducts";

const statusLabels: Record<OrderStatus, string> = {
    DRAFT: "Nháp",
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    PARTIALLY_ISSUED: "Xuất một phần",
    ISSUED: "Đã xuất",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
};

function formatMoney(value: number): string {
    return (
        Number(value || 0).toLocaleString("vi-VN") +
        " ₫"
    );
}

function formatDate(value?: string | null): string {
    if (!value) return "—";

    return new Intl.DateTimeFormat("vi-VN").format(
        new Date(value),
    );
}

function getStatusClass(
    status: OrderStatus,
): string {
    switch (status) {
        case "DRAFT":
            return "bg-gray-100 text-gray-700";

        case "PENDING":
            return "bg-yellow-100 text-yellow-700";

        case "CONFIRMED":
            return "bg-blue-100 text-blue-700";

        case "PROCESSING":
            return "bg-purple-100 text-purple-700";

        case "PARTIALLY_ISSUED":
            return "bg-orange-100 text-orange-700";

        case "ISSUED":
            return "bg-green-100 text-green-700";

        case "COMPLETED":
            return "bg-emerald-100 text-emerald-700";

        case "CANCELLED":
            return "bg-red-100 text-red-700";

        default:
            return "bg-gray-100 text-gray-700";
    }
}

export default function OrderPage() {
    /*
     * =====================================================
     * DATA FORM
     * =====================================================
     */

    const [warehouses, setWarehouses] =
        useState<WarehouseOption[]>([]);

    const [productVariants, setProductVariants] =
        useState<ProductItem[]>([]);

    /*
     * =====================================================
     * ORDERS
     * =====================================================
     */

    const [orders, setOrders] = useState<Order[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    /*
     * =====================================================
     * FILTER
     * =====================================================
     */

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState<OrderStatus | "">("");

    /*
     * =====================================================
     * MODAL
     * =====================================================
     */

    const [showModal, setShowModal] =
        useState(false);

    const [editingOrder, setEditingOrder] =
        useState<Order | null>(null);

    /*
     * =====================================================
     * LOAD ORDERS
     * =====================================================
     */

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const data =
                await orderService.listOrders({
                    search:
                        search.trim() || undefined,

                    status:
                        status || undefined,
                });

            setOrders(data);
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải danh sách đơn hàng.",
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * =====================================================
     * LOAD WAREHOUSES + PRODUCTS
     * =====================================================
     */

    const loadFormOptions = async () => {
        try {
            const [
                warehouseRows,
                productRows,
            ] = await Promise.all([
                warehouseService.listWarehouses(),
                productService.listProducts(),
            ]);

            setWarehouses(
                warehouseRows,
            );

            setProductVariants(
                productRows,
            );
        } catch (err) {
            console.error(
                "Không thể tải dữ liệu form Order:",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể tải kho và sản phẩm.",
            );
        }
    };

    /*
     * =====================================================
     * INITIAL LOAD
     * =====================================================
     */

    useEffect(() => {
        void loadOrders();
        void loadFormOptions();
    }, []);

    /*
     * =====================================================
     * STATUS FILTER
     * =====================================================
     */

    useEffect(() => {
        void loadOrders();
    }, [status]);

    /*
     * =====================================================
     * SEARCH
     * =====================================================
     */

    const handleSearch = (
        event: React.FormEvent,
    ) => {
        event.preventDefault();

        void loadOrders();
    };

    /*
     * =====================================================
     * CREATE
     * =====================================================
     */

    const handleCreate = () => {
        setEditingOrder(null);
        setShowModal(true);
    };

    /*
     * =====================================================
     * EDIT
     * =====================================================
     */

    const handleEdit = (
        order: Order,
    ) => {
        setEditingOrder(order);
        setShowModal(true);
    };

    /*
     * =====================================================
     * CLOSE MODAL
     * =====================================================
     */

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOrder(null);
    };

    /*
     * =====================================================
     * SAVED
     * =====================================================
     */

    const handleSaved = async () => {
        handleCloseModal();

        await loadOrders();
    };

    /*
     * =====================================================
     * CONFIRM
     * =====================================================
     */

    const handleConfirm = async (
        order: Order,
    ) => {
        if (
            !window.confirm(
                `Xác nhận đơn hàng ${order.order_code}?`,
            )
        ) {
            return;
        }

        try {
            setError(null);

            await orderService.confirmOrder(
                order.id,
            );

            await loadOrders();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể xác nhận đơn hàng.",
            );
        }
    };

    /*
     * =====================================================
     * PROCESS
     * =====================================================
     */

    const handleProcess = async (
        order: Order,
    ) => {
        try {
            setError(null);

            await orderService.processOrder(
                order.id,
            );

            await loadOrders();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể chuyển đơn sang trạng thái xử lý.",
            );
        }
    };

    /*
     * =====================================================
     * CANCEL
     * =====================================================
     */

    const handleCancel = async (
        order: Order,
    ) => {
        if (
            !window.confirm(
                `Hủy đơn hàng ${order.order_code}?`,
            )
        ) {
            return;
        }

        try {
            setError(null);

            await orderService.cancelOrder(
                order.id,
            );

            await loadOrders();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể hủy đơn hàng.",
            );
        }
    };

    /*
     * =====================================================
     * COMPLETE
     * =====================================================
     */

    const handleComplete = async (
        order: Order,
    ) => {
        try {
            setError(null);

            await orderService.completeOrder(
                order.id,
            );

            await loadOrders();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể hoàn tất đơn hàng.",
            );
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-5 p-6">

                {/* =================================================
                HEADER
            ================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-pink-700">
                            Quản lý đơn hàng
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Quản lý đơn hàng, trạng thái xử lý và phiếu xuất kho.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreate}
                        className="rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-700"
                    >
                        + Tạo đơn hàng
                    </button>
                </div>

                {/* =================================================
                FILTER
            ================================================= */}

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 gap-3 md:grid-cols-4"
                    >
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Tìm kiếm
                            </label>

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Mã đơn, tên khách hàng, SĐT..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">
                                Trạng thái
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value as
                                        | OrderStatus
                                        | "",
                                    )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            >
                                <option value="">
                                    Tất cả trạng thái
                                </option>

                                {Object.entries(
                                    statusLabels,
                                ).map(
                                    ([
                                        value,
                                        label,
                                    ]) => (
                                        <option
                                            key={
                                                value
                                            }
                                            value={
                                                value
                                            }
                                        >
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full rounded-md border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-100"
                            >
                                Tìm kiếm
                            </button>
                        </div>
                    </form>
                </div>

                {/* =================================================
                ERROR
            ================================================= */}

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* =================================================
                TABLE
            ================================================= */}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-5 py-3">
                        <div>
                            <h2 className="font-semibold text-pink-700">
                                Danh sách đơn hàng
                            </h2>

                            <p className="text-xs text-gray-500">
                                {orders.length} đơn hàng
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[1100px] w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">
                                        Mã đơn
                                    </th>

                                    <th className="px-4 py-3">
                                        Khách hàng
                                    </th>

                                    <th className="px-4 py-3">
                                        Kho
                                    </th>

                                    <th className="px-4 py-3">
                                        Ngày đặt
                                    </th>

                                    <th className="px-4 py-3 text-right">
                                        Tổng tiền
                                    </th>

                                    <th className="px-4 py-3">
                                        Trạng thái
                                    </th>

                                    <th className="px-4 py-3 text-right">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {/* LOADING */}

                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-gray-500"
                                        >
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                )}

                                {/* EMPTY */}

                                {!loading &&
                                    orders.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-gray-500"
                                            >
                                                Không có đơn hàng.
                                            </td>
                                        </tr>
                                    )}

                                {/* DATA */}

                                {!loading &&
                                    orders.map(
                                        (
                                            order,
                                        ) => (
                                            <tr
                                                key={
                                                    order.id
                                                }
                                                className="hover:bg-pink-50/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                order,
                                                            )
                                                        }
                                                        className="font-semibold text-pink-700 hover:underline"
                                                    >
                                                        {
                                                            order.order_code
                                                        }
                                                    </button>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {
                                                            order.customer_name
                                                        }
                                                    </div>

                                                    {order.customer_phone && (
                                                        <div className="text-xs text-gray-500">
                                                            {
                                                                order.customer_phone
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="text-gray-800">
                                                        {
                                                            order.warehouse_name ||
                                                            order.warehouse_code ||
                                                            `#${order.warehouse_id}`
                                                        }
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-gray-600">
                                                    {formatDate(
                                                        order.ordered_at,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {formatMoney(
                                                        order.total_amount,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                                            order.status,
                                                        )}`}
                                                    >
                                                        {
                                                            statusLabels[
                                                            order
                                                                .status
                                                            ]
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-1">

                                                        {/* SỬA */}

                                                        {order.status ===
                                                            "DRAFT" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    Sửa
                                                                </button>
                                                            )}

                                                        {/* XÁC NHẬN */}

                                                        {(order.status ===
                                                            "DRAFT" ||
                                                            order.status ===
                                                            "PENDING") && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleConfirm(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                                                                >
                                                                    Xác nhận
                                                                </button>
                                                            )}

                                                        {/* XỬ LÝ */}

                                                        {order.status ===
                                                            "CONFIRMED" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleProcess(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className="rounded px-2 py-1 text-xs text-purple-600 hover:bg-purple-50"
                                                                >
                                                                    Xử lý
                                                                </button>
                                                            )}

                                                        {/* HỦY */}

                                                        {[
                                                            "PENDING",
                                                            "CONFIRMED",
                                                            "PROCESSING",
                                                        ].includes(
                                                            order.status,
                                                        ) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleCancel(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            )}

                                                        {/* HOÀN TẤT */}

                                                        {order.status ===
                                                            "ISSUED" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void handleComplete(
                                                                            order,
                                                                        )
                                                                    }
                                                                    className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                                                                >
                                                                    Hoàn tất
                                                                </button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* =================================================
                CREATE / EDIT ORDER MODAL
            ================================================= */}

                {showModal && (
                    <OrderModal
                        editingOrder={
                            editingOrder
                        }
                        warehouses={
                            warehouses
                        }
                        productVariants={
                            productVariants
                        }
                        onClose={
                            handleCloseModal
                        }
                        onSaved={
                            handleSaved
                        }
                    />
                )}
            </div>
        </DashboardLayout>
    );
}