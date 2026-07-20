interface FrontendEnv {
    apiBaseUrl: string;
}

export const env: FrontendEnv = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
};
