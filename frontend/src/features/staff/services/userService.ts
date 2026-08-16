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
 * Quản trị viên đặt lại mật khẩu của một nhân viên về `DEFAULT_RESET_PASSWORD`.
 *
 * Cùng kết quả với việc duyệt yêu cầu quên mật khẩu — hệ thống chỉ có một cách
 * đặt lại mật khẩu và một giá trị mặc định duy nhất.
 */
export async function resetUserPassword(id: number): Promise<void> {
    await httpClient.post(`/auth/users/${id}/reset-password`);
}

export type PasswordResetRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PasswordResetRequest {
    id: number;
    userId: number;
    fullName: string;
    employeeCode: string;
    email: string;
    roleCode: string;
    status: PasswordResetRequestStatus;
    note: string | null;
    rejectionReason: string | null;
    approvedByName: string | null;
    rejectedByName: string | null;
    createdAt: string;
}

type PasswordResetRequestRow = {
    id: number;
    user_id: number;
    requested_email: string;
    status: PasswordResetRequestStatus;
    note: string | null;
    rejection_reason: string | null;
    full_name: string;
    employee_code: string | null;
    role_code: string;
    approved_by_name: string | null;
    rejected_by_name: string | null;
    created_at: string;
};

/** Mật khẩu mà backend đặt lại khi quản trị viên duyệt yêu cầu quên mật khẩu. */
export const DEFAULT_RESET_PASSWORD = '123456';

export async function listPasswordResetRequests(
    status?: PasswordResetRequestStatus,
): Promise<PasswordResetRequest[]> {
    const query = status ? `?status=${status}` : '';
    const response = await httpClient.get<{ data: PasswordResetRequestRow[] }>(
        `/auth/password-reset/requests${query}`,
    );

    return unwrapData(response).map((row) => ({
        id: row.id,
        userId: row.user_id,
        fullName: row.full_name,
        employeeCode: row.employee_code ?? String(row.user_id),
        email: row.requested_email,
        roleCode: row.role_code,
        status: row.status,
        note: row.note,
        rejectionReason: row.rejection_reason,
        approvedByName: row.approved_by_name,
        rejectedByName: row.rejected_by_name,
        createdAt: row.created_at,
    }));
}

export async function approvePasswordResetRequest(id: number): Promise<void> {
    await httpClient.post(`/auth/password-reset/requests/${id}/approve`);
}

export async function rejectPasswordResetRequest(id: number, rejectionReason: string): Promise<void> {
    await httpClient.post(`/auth/password-reset/requests/${id}/reject`, { rejectionReason });
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
export const userService = {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    listPasswordResetRequests,
    approvePasswordResetRequest,
    rejectPasswordResetRequest,
};