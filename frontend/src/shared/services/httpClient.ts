import axios from 'axios';
import type { AxiosRequestConfig, Method } from 'axios';
import { env } from '@/shared/config/env';

interface RequestOptions extends Omit<AxiosRequestConfig, 'url' | 'data'> {
    body?: unknown;
}

const authTokenKey = 'bambi_wms_access_token';

export function setAccessToken(token: string | null): void {
    if (token) {
        window.sessionStorage.setItem(authTokenKey, token);
        return;
    }

    window.sessionStorage.removeItem(authTokenKey);
}

export function getAccessToken(): string | null {
    return window.sessionStorage.getItem(authTokenKey);
}

export class HttpError extends Error {
    readonly status: number;
    readonly payload: unknown;

    constructor(status: number, payload: unknown, message = 'HTTP request failed') {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.payload = payload;
    }
}

/**
 * Shared formatter for turning a caught error from an API call into a
 * user-facing Vietnamese message. Distinguishes network failure, expired
 * session and permission errors from other backend errors, and surfaces the
 * backend's own error code/message/requestId when available instead of a
 * generic message that hides what actually failed.
 */
export function getHttpErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpError) {
        if (error.status === 0) {
            return 'Không kết nối được backend. Kiểm tra backend đang chạy và VITE_API_BASE_URL.';
        }

        if (error.status === 401) {
            return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        }

        if (error.status === 403) {
            return 'Tài khoản hiện tại không có quyền thực hiện thao tác này.';
        }

        const payload = error.payload as { error?: { code?: string; message?: string; requestId?: string } } | undefined;
        const backendError = payload?.error;
        const detail = backendError?.message ?? error.message;
        const requestId = backendError?.requestId ? ` Request ID: ${backendError.requestId}.` : '';
        const code = backendError?.code ? ` (${backendError.code})` : '';

        return `${fallback}: HTTP ${error.status}${code} - ${detail}.${requestId}`;
    }

    return fallback;
}

const axiosClient = axios.create({
    baseURL: env.apiBaseUrl,
});

axiosClient.interceptors.request.use((config) => {
    const token = getAccessToken();

    if (token && !config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
});

const authEndpointsExemptFromSessionExpiry = ['/auth/login', '/auth/register', '/auth/refresh'];

function isAuthEndpoint(url?: string): boolean {
    return authEndpointsExemptFromSessionExpiry.some((path) => url?.includes(path));
}

let redirectingToLogin = false;

axiosClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            !isAuthEndpoint(error.config?.url) &&
            !redirectingToLogin
        ) {
            redirectingToLogin = true;
            setAccessToken(null);
            window.location.assign('/login');
        }

        return Promise.reject(error);
    },
);

function toHttpError(error: unknown): HttpError {
    if (axios.isAxiosError<unknown>(error)) {
        return new HttpError(
            error.response?.status ?? 0,
            error.response?.data ?? error.message,
            error.message || 'HTTP request failed',
        );
    }

    if (error instanceof Error) {
        return new HttpError(0, error.message, error.message);
    }

    return new HttpError(0, error);
}

export async function httpRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    const { body, ...axiosOptions } = options;

    try {
        const response = await axiosClient.request<TResponse>({
            ...axiosOptions,
            url: path,
            data: body,
        });

        return response.data;
    } catch (error) {
        throw toHttpError(error);
    }
}

function requestWithMethod<TResponse>(method: Method, path: string, bodyOrOptions?: unknown, options?: RequestOptions): Promise<TResponse> {
    if (method === 'GET' || method === 'DELETE') {
        return httpRequest<TResponse>(path, { ...(bodyOrOptions as RequestOptions | undefined), method });
    }

    return httpRequest<TResponse>(path, { ...options, method, body: bodyOrOptions });
}

export const httpClient = {
    get: <TResponse>(path: string, options?: RequestOptions) => requestWithMethod<TResponse>('GET', path, options),
    post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) => requestWithMethod<TResponse>('POST', path, body, options),
    patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) => requestWithMethod<TResponse>('PATCH', path, body, options),
    put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) => requestWithMethod<TResponse>('PUT', path, body, options),
    delete: <TResponse>(path: string, options?: RequestOptions) => requestWithMethod<TResponse>('DELETE', path, options),
};

export function unwrapData<T>(response: { data: T }): T {
    return response.data;
}