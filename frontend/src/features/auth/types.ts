export type AuthRole = 'ADMIN' | 'KHACHHANG';

export interface AuthUser {
    maTK: string;
    role: AuthRole;
    ten?: string;
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
