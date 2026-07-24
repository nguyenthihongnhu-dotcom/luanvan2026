import { httpClient, HttpError, setAccessToken, unwrapData } from '@/shared/services/httpClient';
import type { AuthResponse, LoginCredentials, RegisterPayload } from '@/features/auth/types';

export class AuthServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthServiceError';
    }
}

type BackendAuthUser = {
    id: number | string;
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
            maTK: String(result.user.id),
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

    if (error instanceof HttpError) {
        if (error.status === 0) {
            return 'Không kết nối được backend. Kiểm tra backend đang chạy và VITE_API_BASE_URL.';
        }

        if (error.status === 429) {
            return 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.';
        }

        // Note: a 401 here means invalid credentials on /auth/login itself,
        // not an expired session — do not reuse the generic "session expired"
        // wording that other API calls use for 401.
        const payload = error.payload as { error?: { message?: string } } | undefined;
        return payload?.error?.message ?? fallback;
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
    const response = await httpClient.post<{ data: BackendLoginResult }>('/auth/register', {
        email: payload.email,
        password: payload.password,
        fullName: payload.username,
        phone: payload.sdt || undefined,
        roleCode: 'STAFF',
    });

    return {
        ...mapBackendAuth(unwrapData(response)),
        message: 'Đăng ký tài khoản thành công!',
    };
}

function logout(): void {
    setAccessToken(null);
}

export const authService = {
    login,
    register,
    logout,
};