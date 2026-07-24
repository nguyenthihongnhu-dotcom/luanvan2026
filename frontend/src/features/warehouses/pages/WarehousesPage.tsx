import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { warehouseService } from '@/features/warehouses/services/warehouseService';
import { getHttpErrorMessage } from '@/shared/services/httpClient';
import type { Warehouse, WarehouseInput, WarehouseStatus } from '@/features/warehouses/services/warehouseService';

const initialFormState: WarehouseInput = {
    code: '',
    name: '',
    addressLine: '',
    ward: '',
    district: '',
    province: '',
    managerUserId: undefined,
    status: 'ACTIVE',
    description: '',
};

function statusLabel(status: WarehouseStatus): string {
    return status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động';
}

function statusClass(status: WarehouseStatus): string {
    return status === 'ACTIVE'
        ? 'border-green-200 bg-green-50 text-green-700'
        : 'border-gray-300 bg-gray-100 text-gray-700';
}

function addressLabel(warehouse: Warehouse): string {
    return [warehouse.address_line, warehouse.ward, warehouse.district, warehouse.province].filter(Boolean).join(', ') || 'Chưa cập nhật';
}

function toFormState(warehouse: Warehouse): WarehouseInput {
    return {
        code: warehouse.code,
        name: warehouse.name ?? '',
        addressLine: warehouse.address_line ?? '',
        ward: warehouse.ward ?? '',
        district: warehouse.district ?? '',
        province: warehouse.province ?? '',
        managerUserId: warehouse.manager_user_id ?? undefined,
        status: warehouse.status,
        description: warehouse.description ?? '',
    };
}

function cleanInput(input: WarehouseInput): WarehouseInput {
    return {
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        addressLine: input.addressLine?.trim() || undefined,
        ward: input.ward?.trim() || undefined,
        district: input.district?.trim() || undefined,
        province: input.province?.trim() || undefined,
        managerUserId: input.managerUserId,
        status: input.status,
        description: input.description?.trim() || undefined,
    };
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<WarehouseStatus | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [formData, setFormData] = useState<WarehouseInput>(initialFormState);

    async function loadWarehouses(nextSearch = searchTerm, nextStatus = statusFilter) {
        setIsLoading(true);
        setError(null);
        try {
            setWarehouses(await warehouseService.listWarehouses({ search: nextSearch, status: nextStatus }));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không tải được danh sách kho từ backend'));
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadWarehouses('', ''); }, []);

    const summary = useMemo(() => ({
        total: warehouses.length,
        active: warehouses.filter((warehouse) => warehouse.status === 'ACTIVE').length,
        inactive: warehouses.filter((warehouse) => warehouse.status === 'INACTIVE').length,
    }), [warehouses]);

    function openCreateModal() {
        setEditingWarehouse(null);
        setFormData(initialFormState);
        setShowModal(true);
    }

    function openEditModal(warehouse: Warehouse) {
        setEditingWarehouse(warehouse);
        setFormData(toFormState(warehouse));
        setShowModal(true);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const payload = cleanInput(formData);
            if (editingWarehouse) {
                await warehouseService.updateWarehouse(editingWarehouse.id, payload);
            } else {
                await warehouseService.createWarehouse(payload);
            }
            setShowModal(false);
            setEditingWarehouse(null);
            setFormData(initialFormState);
            await loadWarehouses();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không lưu được kho. Kiểm tra dữ liệu, quyền thao tác và mã kho không được trùng.'));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(warehouse: Warehouse) {
        if (!window.confirm(`Xóa mềm kho ${warehouse.code} - ${warehouse.name ?? ''}?`)) return;
        setError(null);
        try {
            await warehouseService.deleteWarehouse(warehouse.id);
            await loadWarehouses();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không xóa được kho. Kho có thể không tồn tại hoặc bạn thiếu quyền thao tác.'));
        }
    }

    const columns: ColumnProps<Warehouse>[] = [
        { key: 'code', title: 'Mã kho', className: 'font-semibold text-gray-900' },
        { key: 'name', title: 'Tên kho' },
        { key: 'address_line', title: 'Địa chỉ', render: (_, record) => addressLabel(record) },
        { key: 'manager_user_id', title: 'Quản lý', render: (value) => value ? `#${String(value)}` : 'Chưa gán' },
        {
            key: 'status',
            title: 'Trạng thái',
            render: (value) => {
                const status = value as WarehouseStatus;
                return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusClass(status)}`}>{statusLabel(status)}</span>;
            },
        },
        { key: 'description', title: 'Ghi chú', render: (value) => String(value || '-') },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record) => (
                <div className="flex gap-2">
                    <button type="button" onClick={() => openEditModal(record)} className="text-xs font-medium text-blue-600 hover:text-blue-900">Sửa</button>
                    <button type="button" onClick={() => void handleDelete(record)} className="text-xs font-medium text-red-600 hover:text-red-900">Xóa</button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Quản lý kho</h1>
                        <p className="text-sm text-gray-500">Tạo, cập nhật và ngưng hoạt động kho master dùng cho vị trí, tồn kho và chứng từ.</p>
                    </div>
                    <button type="button" onClick={openCreateModal} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">+ Thêm kho</button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Tổng kho</div>
                        <div className="text-xl font-bold text-gray-900">{summary.total}</div>
                    </div>
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 shadow-sm">
                        <div className="text-xs uppercase text-green-700">Đang hoạt động</div>
                        <div className="text-xl font-bold text-green-800">{summary.active}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Ngưng hoạt động</div>
                        <div className="text-xl font-bold text-gray-900">{summary.inactive}</div>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo mã, tên hoặc địa chỉ kho..." className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 md:col-span-2" />
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as WarehouseStatus | '')} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                            <option value="">Tất cả trạng thái</option>
                            <option value="ACTIVE">Đang hoạt động</option>
                            <option value="INACTIVE">Ngưng hoạt động</option>
                        </select>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => void loadWarehouses()} disabled={isLoading} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isLoading ? 'Đang tải' : 'Lọc'}</button>
                            <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter(''); void loadWarehouses('', ''); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Xóa</button>
                        </div>
                    </div>
                </div>

                <Tablelayout columns={columns} dataSource={warehouses} rowKey="id" isLoading={isLoading} />
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">{editingWarehouse ? 'Sửa kho' : 'Thêm kho'}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mã kho</label>
                                <input required value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Tên kho</label>
                                <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
                                <input value={formData.addressLine ?? ''} onChange={(event) => setFormData({ ...formData, addressLine: event.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <input value={formData.ward ?? ''} onChange={(event) => setFormData({ ...formData, ward: event.target.value })} placeholder="Phường/xã" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            <input value={formData.district ?? ''} onChange={(event) => setFormData({ ...formData, district: event.target.value })} placeholder="Quận/huyện" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            <input value={formData.province ?? ''} onChange={(event) => setFormData({ ...formData, province: event.target.value })} placeholder="Tỉnh/thành" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            <input type="number" min="1" value={formData.managerUserId ?? ''} onChange={(event) => setFormData({ ...formData, managerUserId: event.target.value ? Number(event.target.value) : undefined })} placeholder="ID người quản lý" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as WarehouseStatus })} className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                <option value="ACTIVE">Đang hoạt động</option>
                                <option value="INACTIVE">Ngưng hoạt động</option>
                            </select>
                            <textarea value={formData.description ?? ''} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Ghi chú" className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 md:col-span-2" rows={3} />
                            <div className="flex gap-3 pt-2 md:col-span-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={isSaving} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isSaving ? 'Đang lưu' : 'Lưu kho'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
