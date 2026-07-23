import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { authorizationService } from '@/features/authorization/services/authorizationService';
import type { AuthorizationRole } from '@/features/authorization/services/authorizationService';

function permissionsOf(role: AuthorizationRole): string[] {
    return role.permissions ? role.permissions.split(',').filter(Boolean) : [];
}

export default function AuthorizationPage() {
    const [roles, setRoles] = useState<AuthorizationRole[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function loadRoles(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setRoles(await authorizationService.listAuthorization(search));
        } catch (err) {
            console.error(err);
            setError('Không tải được danh sách vai trò và quyền từ backend.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { void loadRoles(''); }, []);

    const totalPermissions = useMemo(() => new Set(roles.flatMap(permissionsOf)).size, [roles]);

    const columns: ColumnProps<AuthorizationRole>[] = [
        { key: 'code', title: 'Mã vai trò', className: 'font-semibold text-gray-900' },
        { key: 'name', title: 'Tên vai trò' },
        { key: 'description', title: 'Mô tả', render: (value) => String(value || '-') },
        { key: 'is_system', title: 'Loại', render: (value) => value ? 'Hệ thống' : 'Tùy chỉnh' },
        {
            key: 'permissions',
            title: 'Quyền',
            render: (_, record) => {
                const permissions = permissionsOf(record);
                if (permissions.length === 0) return 'Chưa gán';
                return (
                    <div className="flex max-w-xl flex-wrap gap-1">
                        {permissions.map((permission) => <span key={permission} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">{permission}</span>)}
                    </div>
                );
            },
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Phân quyền</h1>
                    <p className="text-sm text-gray-500">Xem vai trò hệ thống và permission backend đang cấp cho từng vai trò.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm"><div className="text-xs uppercase text-gray-500">Vai trò</div><div className="text-xl font-bold text-gray-900">{roles.length}</div></div>
                    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm"><div className="text-xs uppercase text-gray-500">Permission khác nhau</div><div className="text-xl font-bold text-gray-900">{totalPermissions}</div></div>
                </div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row">
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm vai trò hoặc permission..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <button type="button" onClick={() => void loadRoles()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lọc</button>
                    </div>
                </div>
                <Tablelayout columns={columns} dataSource={roles} rowKey="id" isLoading={isLoading} />
            </div>
        </DashboardLayout>
    );
}
