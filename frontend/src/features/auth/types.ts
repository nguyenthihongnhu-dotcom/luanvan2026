export type AuthRole = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF' | 'AUDITOR' | 'KHACHHANG';

export interface AuthUser {
    maTK: string;
    role: AuthRole | string;
    ten?: string;
    permissions?: string[];
    accessToken?: string;
    refreshToken?: string;
}

export interface RegisterData {
    username: string;
    password: string;
    confirmPassword: string;
    sdt: string;
    email: string;
    diaChi: string;
}

export type LoginCredentials = Pick<RegisterData, 'username' | 'password'>;
export type RegisterPayload = Omit<RegisterData, 'confirmPassword'>;

export interface AuthResponse {
    result: AuthUser;
    message: string;
}
