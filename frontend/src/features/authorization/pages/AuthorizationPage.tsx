import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { authorizationService } from '@/features/authorization/services/authorizationService';
import { getHttpErrorMessage } from '@/shared/services/httpClient';
import type { AuthorizationRole, PermissionItem } from '@/features/authorization/services/authorizationService';

function permissionsOf(role: AuthorizationRole): string[] {
    return role.permissions ? role.permissions.split(',').filter(Boolean) : [];
}

/**
 * Tên nhóm quyền và tên vai trò hiển thị bằng tiếng Việt. Mã (`module`, `code`)
 * giữ nguyên tiếng Anh vì backend dùng chúng làm khóa trong requirePermission().
 */
const MODULE_LABELS: Record<string, string> = {
    alerts: 'Cảnh báo tồn kho',
    auth: 'Tài khoản nhân viên',
    authorization: 'Phân quyền',
    goods_issues: 'Phiếu xuất kho',
    goods_receipts: 'Phiếu nhập kho',
    notifications: 'Thông báo',
    settings: 'Tham số hệ thống',
    stock_adjustments: 'Phiếu điều chỉnh tồn',
    stock_counts: 'Phiếu kiểm kê',
    stock_transfers: 'Phiếu chuyển kho',
    warehouses: 'Kho hàng',
};

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    WAREHOUSE_MANAGER: 'Quản lý kho',
    STAFF: 'Nhân viên kho',
    AUDITOR: 'Kiểm soát viên',
};

function moduleLabel(moduleName: string): string {
    return MODULE_LABELS[moduleName] ?? moduleName;
}

function roleLabel(code: string, fallback: string): string {
    return ROLE_LABELS[code] ?? fallback;
}

export default function AuthorizationPage() {
    const [roles, setRoles] = useState<AuthorizationRole[]>([]);
    const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [editingRole, setEditingRole] = useState<AuthorizationRole | null>(null);
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
    const [permSearchTerm, setPermSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    async function loadRoles(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setRoles(await authorizationService.listAuthorization(search));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không tải được danh sách vai trò và quyền từ backend'));
        } finally {
            setIsLoading(false);
        }
    }

    async function loadAllPermissions() {
        try {
            const perms = await authorizationService.listAllPermissions();
            setAllPermissions(perms);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        void loadRoles('');
        void loadAllPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    }, []);

    const totalPermissions = useMemo(() => new Set(roles.flatMap(permissionsOf)).size, [roles]);

    function openEditModal(role: AuthorizationRole) {
        setEditingRole(role);
        setSelectedPerms(new Set(permissionsOf(role)));
        setPermSearchTerm('');
        setSaveSuccess(null);
    }

    function closeEditModal() {
        setEditingRole(null);
        setSelectedPerms(new Set());
        setPermSearchTerm('');
    }

    function togglePermission(code: string) {
        const next = new Set(selectedPerms);
        if (next.has(code)) {
            next.delete(code);
        } else {
            next.add(code);
        }
        setSelectedPerms(next);
    }

    function toggleModulePermissions(permsInModule: PermissionItem[]) {
        const next = new Set(selectedPerms);
        const allSelected = permsInModule.every((p) => next.has(p.code));
        if (allSelected) {
            permsInModule.forEach((p) => next.delete(p.code));
        } else {
            permsInModule.forEach((p) => next.add(p.code));
        }
        setSelectedPerms(next);
    }

    async function handleSavePermissions() {
        if (!editingRole) return;
        setIsSaving(true);
        setError(null);
        setSaveSuccess(null);
        try {
            await authorizationService.updateRolePermissions(
                editingRole.id,
                Array.from(selectedPerms),
            );
            setSaveSuccess(`Đã cập nhật quyền thành công cho vai trò "${editingRole.name}".`);
            await loadRoles();
            setTimeout(() => {
                closeEditModal();
            }, 1200);
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không lưu được quyền cho vai trò'));
        } finally {
            setIsSaving(false);
        }
    }

    const groupedPermissions = useMemo(() => {
        const filtered = allPermissions.filter(
            (p) =>
                p.code.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
                p.name?.toLowerCase().includes(permSearchTerm.toLowerCase()) ||
                p.module?.toLowerCase().includes(permSearchTerm.toLowerCase()),
        );

        const groups: Record<string, PermissionItem[]> = {};
        for (const perm of filtered) {
            const mod = perm.module || 'khac';
            if (!groups[mod]) groups[mod] = [];
            groups[mod].push(perm);
        }
        return groups;
    }, [allPermissions, permSearchTerm]);

    const columns: ColumnProps<AuthorizationRole>[] = [
        { key: 'code', title: 'Mã vai trò', className: 'font-semibold text-gray-900' },
        { key: 'name', title: 'Tên vai trò', render: (value, record) => roleLabel(record.code, String(value ?? '')) },
        { key: 'description', title: 'Mô tả', render: (value) => String(value || '-') },
        { key: 'is_system', title: 'Loại', render: (value) => value ? 'Hệ thống' : 'Tùy chỉnh' },
        {
            key: 'permissions',
            title: 'Quyền hiện có',
            render: (_, record) => {
                const permissions = permissionsOf(record);
                if (permissions.length === 0) return <span className="text-gray-400 italic">Chưa gán</span>;
                return (
                    <div className="flex max-w-xl flex-wrap gap-1">
                        {permissions.map((permission) => (
                            <span key={permission} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                                {permission}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record) => (
                <button
                    type="button"
                    onClick={() => openEditModal(record)}
                    className="rounded bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700 hover:bg-pink-100 border border-pink-200"
                >
                    Phân quyền
                </button>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Phân quyền vai trò</h1>
                    <p className="text-sm text-gray-500">Xem và quản lý các quyền (permission) cấp cho từng vai trò trong hệ thống.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Tổng vai trò</div>
                        <div className="text-xl font-bold text-gray-900">{roles.length}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Quyền đang dùng</div>
                        <div className="text-xl font-bold text-gray-900">{totalPermissions}</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">Tổng quyền hệ thống</div>
                        <div className="text-xl font-bold text-gray-900">{allPermissions.length}</div>
                    </div>
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row">
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm vai trò hoặc quyền..."
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <button type="button" onClick={() => void loadRoles()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">
                            Lọc
                        </button>
                    </div>
                </div>

                <Tablelayout columns={columns} dataSource={roles} rowKey="id" isLoading={isLoading} />

                {/* Edit Permissions Modal */}
                {editingRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">
                                        Cấp quyền cho vai trò: <span className="text-pink-600">{editingRole.name}</span> ({editingRole.code})
                                    </h2>
                                    <p className="text-xs text-gray-500">Chọn hoặc bỏ chọn các quyền bên dưới để phân quyền cho vai trò này.</p>
                                </div>
                                <button type="button" onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                                    ✕
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {saveSuccess && (
                                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                                        {saveSuccess}
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-4">
                                    <input
                                        value={permSearchTerm}
                                        onChange={(e) => setPermSearchTerm(e.target.value)}
                                        placeholder="Lọc danh sách quyền..."
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                    <span className="text-xs font-medium text-gray-600">
                                        Đã chọn: <strong className="text-pink-600">{selectedPerms.size}</strong> / {allPermissions.length}
                                    </span>
                                </div>

                                {Object.keys(groupedPermissions).length === 0 ? (
                                    <div className="py-8 text-center text-sm text-gray-500">Không tìm thấy quyền phù hợp.</div>
                                ) : (
                                    Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                                        const allInModSelected = perms.every((p) => selectedPerms.has(p.code));
                                        return (
                                            <div key={moduleName} className="rounded-md border border-gray-200 bg-gray-50/50 p-3">
                                                <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-pink-700">
                                                        {moduleLabel(moduleName)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleModulePermissions(perms)}
                                                        className="text-xs text-pink-600 hover:underline font-medium"
                                                    >
                                                        {allInModSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả module'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    {perms.map((perm) => {
                                                        const isChecked = selectedPerms.has(perm.code);
                                                        return (
                                                            <label
                                                                key={perm.code}
                                                                className={`flex cursor-pointer items-start gap-2.5 rounded border p-2 text-xs transition-colors ${
                                                                    isChecked
                                                                        ? 'border-pink-300 bg-pink-50/60 text-gray-900'
                                                                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => togglePermission(perm.code)}
                                                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                                                />
                                                                <div>
                                                                    <div className="font-semibold">{perm.name || perm.code}</div>
                                                                    <div className="text-[11px] text-gray-500">{perm.code}</div>
                                                                    {perm.description && (
                                                                        <div className="mt-0.5 text-[11px] text-gray-400">{perm.description}</div>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => void handleSavePermissions()}
                                    className="rounded-md bg-pink-600 px-5 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

