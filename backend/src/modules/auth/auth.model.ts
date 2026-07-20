import type { RowDataPacket } from 'mysql2/promise';
import type { JwtPayload } from 'jsonwebtoken';

export type AuthUser = {
  id: string;
  role: string;
  permissions: string[];
};

export type AccessTokenPayload = JwtPayload & {
  sub?: string;
  userId?: string | number;
  id?: string | number;
};

export type AuthUserRow = RowDataPacket & {
  id: string | number;
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
  role_code: string;
  permissions: string | null;
};

export type LoginUserRow = AuthUserRow & {
  email: string;
  full_name: string;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
};

export type SessionRow = RowDataPacket & {
  id: number;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
};

export type PasswordResetTokenRow = RowDataPacket & {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
};

export type LoginInput = {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
};

export type RefreshInput = {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
};

export type LogoutInput = {
  refreshToken: string;
};

export type RequestPasswordResetInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginResult = TokenPair & {
  user: AuthUser;
};

export type RefreshResult = TokenPair & {
  user: AuthUser;
};

export type LogoutResult = {
  revoked: boolean;
};

export type RequestPasswordResetResult = {
  accepted: true;
  resetToken?: string;
};

export type ResetPasswordResult = {
  reset: true;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  employeeCode?: string;
  roleCode?: string;
};

export type RegisterResult = LoginResult;

export type UserListRow = RowDataPacket & {
  id: number;
  employee_code: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  role_code: string;
  role_name: string;
};
