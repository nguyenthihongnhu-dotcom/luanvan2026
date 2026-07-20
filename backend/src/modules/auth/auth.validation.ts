import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  LoginInput,
  LogoutInput,
  RefreshInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  RegisterInput,
} from './auth.model';

const passwordSchema = z.string().min(8).max(128);

const loginSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32).max(512),
});

const logoutSchema = refreshSchema;

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(512),
  newPassword: passwordSchema,
});
const registerSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
  password: z.string().min(6).max(128),
  fullName: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(30).optional(),
  employeeCode: z.string().trim().min(1).max(50).optional(),
  roleCode: z
    .enum(['ADMIN', 'WAREHOUSE_MANAGER', 'STAFF', 'AUDITOR'])
    .optional(),
});

export function parseLoginInput(
  input: unknown,
  metadata: Pick<LoginInput, 'userAgent' | 'ipAddress'>,
): LoginInput {
  return { ...validateInput(loginSchema, input), ...metadata };
}

export function parseRefreshInput(
  input: unknown,
  metadata: Pick<RefreshInput, 'userAgent' | 'ipAddress'>,
): RefreshInput {
  return { ...validateInput(refreshSchema, input), ...metadata };
}

export function parseLogoutInput(input: unknown): LogoutInput {
  return validateInput(logoutSchema, input);
}

export function parseRequestPasswordResetInput(
  input: unknown,
): RequestPasswordResetInput {
  return validateInput(requestPasswordResetSchema, input);
}

export function parseResetPasswordInput(input: unknown): ResetPasswordInput {
  return validateInput(resetPasswordSchema, input);
}

export function parseRegisterInput(input: unknown): RegisterInput {
  return validateInput(registerSchema, input);
}
