import 'dotenv/config';

export type AppConfig = {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  corsOrigin: string;
  dbConnectionLimit: number;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  passwordResetTtlMinutes: number;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

export const config: AppConfig = {
  port: readNumberEnv('PORT', 3000),
  databaseUrl: readRequiredEnv('DATABASE_URL'),
  jwtSecret: readRequiredEnv('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  dbConnectionLimit: readNumberEnv('DB_CONNECTION_LIMIT', 10),
  accessTokenTtlSeconds: readNumberEnv('ACCESS_TOKEN_TTL_SECONDS', 900),
  refreshTokenTtlDays: readNumberEnv('REFRESH_TOKEN_TTL_DAYS', 30),
  passwordResetTtlMinutes: readNumberEnv('PASSWORD_RESET_TTL_MINUTES', 15),
};
