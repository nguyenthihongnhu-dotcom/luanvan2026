import { httpClient, setAccessToken, unwrapData } from '@/shared/services/httpClient';
import type { AuthResponse, LoginCredentials, RegisterPayload } from '@/features/auth/types';

export class AuthServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthServiceError';
    }
}

type BackendAuthUser = {
    id: string;
    role: string;
    permissions: string[];
};

type BackendLoginResult = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: BackendAuthUser;
};

function mapBackendAuth(result: BackendLoginResult): AuthResponse {
    setAccessToken(result.accessToken);

    return {
        result: {
            maTK: result.user.id,
            role: result.user.role,
            ten: result.user.role,
            permissions: result.user.permissions,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
        message: 'Đăng nhập thành công!',
    };
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AuthServiceError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message || fallback;
    }

    return fallback;
}

async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await httpClient.post<{ data: BackendLoginResult }>('/auth/login', {
        email: credentials.username,
        password: credentials.password,
    });

    return mapBackendAuth(unwrapData(response));
}

async function register(payload: RegisterPayload): Promise<AuthResponse> {
    void payload;
    throw new AuthServiceError('Backend hiện chưa có API đăng ký tài khoản. Vui lòng tạo user trong database.');
}

function logout(): void {
    setAccessToken(null);
}

export const authService = {
    login,
    register,
    logout,
};
