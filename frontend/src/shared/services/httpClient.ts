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