import type { AuthResponse, LoginCredentials, RegisterPayload } from '@/features/auth/types';

export class AuthServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthServiceError';
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AuthServiceError) {
        return error.message;
    }

    return fallback;
}

async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(800);

    if (credentials.username === 'admin' && credentials.password === 'admin123') {
        return {
            result: { maTK: 'AD001', role: 'ADMIN', ten: 'Quan tri vien' },
            message: 'Dang nhap quyen Admin thanh cong!',
        };
    }

    if (credentials.username === 'user' && credentials.password === '123456') {
        return {
            result: { maTK: 'KH001', role: 'KHACHHANG', ten: 'Khach hang mau' },
            message: 'Dang nhap thanh cong!',
        };
    }

    throw new AuthServiceError('Tai khoan hoac mat khau khong dung (Thu admin/admin123 hoac user/123456)');
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
    await delay(800);
    void payload;

    return {
        result: { maTK: '123', role: 'KHACHHANG' },
        message: 'Dang ky thanh cong!',
    };
}

export const authService = {
    login,
    register,
};



