import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface User {
    MaNguoiDung: number;
    HoTen: string;
    MaNhanVien: string;
    Email: string;
    SoDienThoai: string;
    VaiTro: string;
    TrangThai: string;
}

type UserRow = {
    id: number;
    employee_code: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
    role_code: string;
};

function roleLabel(code: string): string {
    if (code === 'ADMIN') return 'Admin';
    if (code === 'WAREHOUSE_MANAGER') return 'Quản lý kho';
    if (code === 'AUDITOR') return 'Kiểm toán';
    return 'Nhân viên kho';
}

export async function listUsers(): Promise<User[]> {
    const response = await httpClient.get<{ data: UserRow[] }>('/auth/users');
    return unwrapData(response).map((row) => ({
        MaNguoiDung: row.id,
        HoTen: row.full_name,
        MaNhanVien: row.employee_code ?? String(row.id),
        Email: row.email,
        SoDienThoai: row.phone ?? '',
        VaiTro: roleLabel(row.role_code),
        TrangThai: row.status === 'ACTIVE' ? 'HoatDong' : 'TamKhoa',
    }));
}

export const userService = { listUsers };