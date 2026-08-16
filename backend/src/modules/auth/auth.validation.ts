import { z } from 'zod';
import { validateInput } from '../../common/validation/validate';
import type {
  CreatePasswordResetRequestInput,
  LoginInput,
  LogoutInput,
  PasswordResetRequestsFilters,
  RefreshInput,
  CreateUserInput,
  RegisterInput,
  UpdateUserInput,
} from './auth.model';

const loginSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32).max(512),
});

const logoutSchema = refreshSchema;

const registerSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
  password: z.string().min(6).max(128),
  fullName: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(30).optional(),
  employeeCode: z.string().trim().min(1).max(50).optional(),
});

const createUserSchema = registerSchema.extend({
  roleCode: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'STAFF', 'AUDITOR']),
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

export function parseUserId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

const createPasswordResetRequestSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
  note: z.string().trim().max(500).optional(),
});

const passwordResetRequestsFiltersSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

/** Từ chối bắt buộc nêu lý do để nhân viên biết vì sao yêu cầu bị bỏ. */
const rejectPasswordResetRequestSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(500),
});

export function parseCreatePasswordResetRequestInput(
  input: unknown,
  metadata: Pick<CreatePasswordResetRequestInput, 'userAgent' | 'ipAddress'>,
): CreatePasswordResetRequestInput {
  return {
    ...validateInput(createPasswordResetRequestSchema, input),
    ...metadata,
  };
}

export function parsePasswordResetRequestsFilters(
  input: unknown,
): PasswordResetRequestsFilters {
  return validateInput(passwordResetRequestsFiltersSchema, input);
}

export function parsePasswordResetRequestId(input: unknown): number {
  return validateInput(z.coerce.number().int().positive(), input);
}

export function parseRejectPasswordResetRequestInput(input: unknown): {
  rejectionReason: string;
} {
  return validateInput(rejectPasswordResetRequestSchema, input);
}

export function parseRegisterInput(input: unknown): RegisterInput {
  return validateInput(registerSchema, input);
}

export function parseCreateUserInput(input: unknown): CreateUserInput {
  return validateInput(createUserSchema, input);
}

const updateUserSchema = z.object({
  email: z.string().trim().email().max(191).toLowerCase(),
  fullName: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(30).optional(),
  employeeCode: z.string().trim().min(1).max(50).optional(),
  roleCode: z.enum(['ADMIN', 'WAREHOUSE_MANAGER', 'STAFF', 'AUDITOR']),
  status: z.enum(['ACTIVE', 'LOCKED', 'INACTIVE']),
});

export function parseUpdateUserInput(input: unknown): UpdateUserInput {
  return validateInput(updateUserSchema, input);
}
