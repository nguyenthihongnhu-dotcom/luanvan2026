import { env } from '@/shared/config/env';

interface RequestOptions extends Omit<RequestInit, 'body'> {
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

async function parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
}

function buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function httpRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    const headers = new Headers(options.headers);
    const token = getAccessToken();

    if (options.body !== undefined && !headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }

    if (token && !headers.has('authorization')) {
        headers.set('authorization', `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(path), {
        ...options,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
        throw new HttpError(response.status, payload);
    }

    return payload as TResponse;
}

export const httpClient = {
    get: <TResponse>(path: string, options?: RequestOptions) => httpRequest<TResponse>(path, { ...options, method: 'GET' }),
    post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) => httpRequest<TResponse>(path, { ...options, method: 'POST', body }),
    patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) => httpRequest<TResponse>(path, { ...options, method: 'PATCH', body }),
    put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) => httpRequest<TResponse>(path, { ...options, method: 'PUT', body }),
    delete: <TResponse>(path: string, options?: RequestOptions) => httpRequest<TResponse>(path, { ...options, method: 'DELETE' }),
};

export function unwrapData<T>(response: { data: T }): T {
    return response.data;
}
