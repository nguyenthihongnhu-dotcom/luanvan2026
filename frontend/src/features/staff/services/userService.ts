import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type UserRoleCode = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF' | 'AUDITOR';

export interface User {
    MaNguoiDung: number;
    HoTen: string;
    MaNhanVien: string;
    Email: string;
    SoDienThoai: string;
    VaiTro: string;
    TrangThai: string;
    roleCode: UserRoleCode;
}

export interface UpdateUserInput {
    fullName: string;
    email: string;
    phone?: string;
    employeeCode?: string;
    roleCode: UserRoleCode;
    status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
}
export interface CreateUserInput {
    fullName: string;
    email: string;
    phone?: string;
    employeeCode?: string;
    password: string;
    roleCode: UserRoleCode;
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

export function roleLabel(code: string): string {
    if (code === 'ADMIN') return 'Quản trị viên';
    if (code === 'WAREHOUSE_MANAGER') return 'Quản lý kho';
    if (code === 'AUDITOR') return 'Kiểm toán';
    return 'Nhân viên kho';
}

function normalizeRoleCode(code: string): UserRoleCode {
    if (code === 'ADMIN' || code === 'WAREHOUSE_MANAGER' || code === 'AUDITOR') return code;
    return 'STAFF';
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
        roleCode: normalizeRoleCode(row.role_code),
    }));
}

/**
 * Sinh mã đặt lại mật khẩu cho nhân viên. Quản trị viên không xem hay đặt hộ mật
 * khẩu: hệ thống chỉ cấp một mã dùng một lần, nhân viên tự nhập mật khẩu mới.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
    const response = await httpClient.post<{ data: { accepted: boolean; resetToken?: string } }>(
        '/auth/password-reset/request',
        { email },
    );
    return unwrapData(response)?.resetToken ?? null;
}

export async function createUser(input: CreateUserInput): Promise<void> {
    await httpClient.post('/auth/users', {
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        phone: input.phone || undefined,
        employeeCode: input.employeeCode || undefined,
        roleCode: input.roleCode,
    });
}


export async function updateUser(id: number, input: UpdateUserInput): Promise<void> {
    await httpClient.put(`/auth/users/${id}`, {
        email: input.email,
        fullName: input.fullName,
        phone: input.phone || undefined,
        employeeCode: input.employeeCode || undefined,
        roleCode: input.roleCode,
        status: input.status,
    });
}

export async function deleteUser(id: number): Promise<void> {
    await httpClient.delete(`/auth/users/${id}`);
}
export const userService = { listUsers, createUser, updateUser, deleteUser, requestPasswordReset };