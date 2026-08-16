import type { RowDataPacket } from 'mysql2/promise';
import type { JwtPayload } from 'jsonwebtoken';

export type AuthUser = {
  id: string;
  role: string;
  permissions: string[];
  fullName?: string;
};

export type AccessTokenPayload = JwtPayload & {
  sub?: string;
  userId?: string | number;
  id?: string | number;
};

export type AuthUserRow = RowDataPacket & {
  id: string | number;
  full_name?: string;
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

export type ResetUserPasswordInput = {
  userId: number;
  resetBy: number;
};

export type ResetUserPasswordResult = {
  userId: number;
  email: string;
  fullName: string;
  passwordReset: true;
};

export type PasswordResetRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PasswordResetRequestRow = RowDataPacket & {
  id: number;
  user_id: number;
  requested_email: string;
  status: PasswordResetRequestStatus;
  note: string | null;
  approved_by: number | null;
  approved_at: Date | null;
  rejected_by: number | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
};

/** Dòng hiển thị cho quản trị viên, kèm tên người yêu cầu và người đã xử lý. */
export type PasswordResetRequestListRow = PasswordResetRequestRow & {
  full_name: string;
  employee_code: string | null;
  role_code: string;
  user_status: string;
  approved_by_name: string | null;
  rejected_by_name: string | null;
};

export type PasswordResetRequestsFilters = {
  status?: PasswordResetRequestStatus;
};

export type CreatePasswordResetRequestInput = {
  email: string;
  note?: string;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Luôn `accepted: true` kể cả khi email không tồn tại — không để màn hình đăng
 * nhập trở thành công cụ dò xem email nào có tài khoản.
 */
export type CreatePasswordResetRequestResult = {
  accepted: true;
};

export type ApprovePasswordResetRequestInput = {
  requestId: number;
  approvedBy: number;
};

export type ApprovePasswordResetRequestResult = {
  requestId: number;
  userId: number;
  email: string;
  fullName: string;
  status: 'APPROVED';
};

export type RejectPasswordResetRequestInput = {
  requestId: number;
  rejectedBy: number;
  rejectionReason: string;
};

export type RejectPasswordResetRequestResult = {
  requestId: number;
  userId: number;
  status: 'REJECTED';
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

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  employeeCode?: string;
};

export type CreateUserInput = RegisterInput & {
  roleCode: 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF' | 'AUDITOR';
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

export type UpdateUserInput = {
  fullName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  roleCode: string;
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
};

export type UserMutationResult = {
  affectedRows: number;
  insertId?: number;
};
