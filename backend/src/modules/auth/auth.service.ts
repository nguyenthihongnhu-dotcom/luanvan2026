/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../common/http';
import { config } from '../../config/config';
import type {
  AccessTokenPayload,
  ApprovePasswordResetRequestInput,
  ApprovePasswordResetRequestResult,
  AuthUser,
  CreatePasswordResetRequestInput,
  CreatePasswordResetRequestResult,
  PasswordResetRequestListRow,
  PasswordResetRequestsFilters,
  RejectPasswordResetRequestInput,
  RejectPasswordResetRequestResult,
  ResetUserPasswordInput,
  ResetUserPasswordResult,
  LoginInput,
  LoginResult,
  LogoutInput,
  LogoutResult,
  RefreshInput,
  RefreshResult,
  CreateUserInput,
  RegisterInput,
  RegisterResult,
  UserListRow,
  TokenPair,
  UpdateUserInput,
  UserMutationResult,
} from './auth.model';
import {
  approvePasswordResetRequestTransaction,
  createPasswordResetRequest,
  createSession,
  findActiveAuthUserById,
  findLoginUserByEmail,
  findPasswordResetRequests,
  findUserByEmailForReset,
  markLoginFailure,
  markLoginSuccess,
  rejectPasswordResetRequestTransaction,
  resetUserPasswordTransaction,
  createUser,
  listUsers as listUsersRepository,
  updateUserRepository,
  deleteUserRepository,
  rotateRefreshSession,
  revokeSessionByRefreshHash,
} from './auth.repository';

/**
 * Mật khẩu mặc định sau mỗi lần đặt lại, dùng chung cho cả hai đường vào:
 * quản trị viên bấm "Đặt lại mật khẩu" trong màn hình Nhân viên, và quản trị
 * viên duyệt yêu cầu quên mật khẩu nhân viên gửi từ màn hình đăng nhập.
 *
 * Cố ý để dễ đọc qua điện thoại: nhân viên kho nhận lại tài khoản rồi tự đổi.
 * Vì vậy phiên đăng nhập cũ bị thu hồi và tài khoản được mở khóa ngay khi đặt
 * lại — xem `applyPasswordResetToUser` trong repository.
 */
export const DEFAULT_RESET_PASSWORD = '123456';

const passwordResetRequestErrorMap: Record<string, HttpError> = {
  PASSWORD_RESET_REQUEST_NOT_FOUND: new HttpError(
    404,
    'Không tìm thấy yêu cầu đặt lại mật khẩu',
    'PASSWORD_RESET_REQUEST_NOT_FOUND',
  ),
  PASSWORD_RESET_REQUEST_NOT_PENDING: new HttpError(
    409,
    'Yêu cầu này đã được xử lý trước đó',
    'PASSWORD_RESET_REQUEST_NOT_PENDING',
  ),
  PASSWORD_RESET_USER_NOT_FOUND: new HttpError(
    404,
    'Không tìm thấy tài khoản cần đặt lại mật khẩu',
    'PASSWORD_RESET_USER_NOT_FOUND',
  ),
};

function mapPasswordResetRequestError(error: unknown): never {
  if (error instanceof Error && passwordResetRequestErrorMap[error.message]) {
    throw passwordResetRequestErrorMap[error.message];
  }

  throw error;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function toAuthUser(input: {
  id: string | number;
  role_code: string;
  permissions: string | null;
  full_name?: string;
}): AuthUser {
  return {
    id: String(input.id),
    role: input.role_code,
    permissions: input.permissions ? input.permissions.split(',') : [],
    fullName: input.full_name || undefined,
  };
}

function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    {
      role: user.role,
      permissions: user.permissions,
    },
    config.jwtSecret,
    {
      subject: user.id,
      expiresIn: config.accessTokenTtlSeconds,
    },
  );
}

async function issueTokenPair(
  user: AuthUser,
  metadata: { userAgent?: string; ipAddress?: string },
): Promise<TokenPair> {
  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshToken);
  const accessToken = signAccessToken(user);

  await createSession({
    userId: user.id,
    refreshTokenHash,
    expiresAt: addDays(config.refreshTokenTtlDays),
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.accessTokenTtlSeconds,
  };
}

export function extractBearerToken(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const [scheme, token] = value.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined;
  }

  return token;
}

function verifyJwtPayload(token: string | undefined): AccessTokenPayload {
  if (!token) {
    throw new HttpError(401, 'Missing access token', 'TOKEN_MISSING');
  }

  try {
    return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
  } catch {
    throw new HttpError(
      401,
      'Invalid or expired access token',
      'TOKEN_INVALID',
    );
  }
}

export async function verifyAccessToken(
  token: string | undefined,
): Promise<AuthUser> {
  const payload = verifyJwtPayload(token);
  const id = payload.sub ?? payload.userId ?? payload.id;

  if (!id) {
    throw new HttpError(
      401,
      'Invalid access token payload',
      'TOKEN_INVALID_PAYLOAD',
    );
  }

  const user = await findActiveAuthUserById(String(id));

  if (!user) {
    throw new HttpError(
      401,
      'User is inactive or no longer exists',
      'USER_INACTIVE',
    );
  }

  return toAuthUser(user);
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await findLoginUserByEmail(input.email);

  if (!user) {
    throw new HttpError(
      401,
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  if (user.status !== 'ACTIVE') {
    throw new HttpError(403, 'User is not active', 'USER_NOT_ACTIVE');
  }

  if (user.locked_until && user.locked_until.getTime() > Date.now()) {
    throw new HttpError(423, 'User is temporarily locked', 'USER_LOCKED');
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password_hash,
  );

  if (!passwordMatches) {
    await markLoginFailure(String(user.id));
    throw new HttpError(
      401,
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  await markLoginSuccess(String(user.id));

  const authUser = toAuthUser(user);
  const tokenPair = await issueTokenPair(authUser, {
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  return {
    ...tokenPair,
    user: authUser,
  };
}

export async function refresh(input: RefreshInput): Promise<RefreshResult> {
  const oldRefreshTokenHash = hashToken(input.refreshToken);
  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = hashToken(refreshToken);
  const session = await rotateRefreshSession({
    oldRefreshTokenHash,
    newRefreshTokenHash: refreshTokenHash,
    expiresAt: addDays(config.refreshTokenTtlDays),
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  if (!session) {
    throw new HttpError(401, 'Invalid refresh token', 'REFRESH_TOKEN_INVALID');
  }

  const user = await findActiveAuthUserById(String(session.user_id));

  if (!user) {
    await revokeSessionByRefreshHash(refreshTokenHash);
    throw new HttpError(
      401,
      'User is inactive or no longer exists',
      'USER_INACTIVE',
    );
  }

  const authUser = toAuthUser(user);

  return {
    accessToken: signAccessToken(authUser),
    refreshToken,
    expiresIn: config.accessTokenTtlSeconds,
    user: authUser,
  };
}

export async function logout(input: LogoutInput): Promise<LogoutResult> {
  return {
    revoked: await revokeSessionByRefreshHash(hashToken(input.refreshToken)),
  };
}

/**
 * Quản trị viên đặt lại mật khẩu cho một nhân viên, không cần nhân viên gửi yêu cầu.
 *
 * Dùng chung `DEFAULT_RESET_PASSWORD` với đường duyệt yêu cầu quên mật khẩu —
 * hệ thống chỉ có đúng một cách đặt lại mật khẩu, một giá trị mặc định.
 */
export async function resetUserPassword(
  input: ResetUserPasswordInput,
): Promise<ResetUserPasswordResult> {
  const passwordHash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 12);

  try {
    const result = await resetUserPasswordTransaction({
      userId: input.userId,
      resetBy: input.resetBy,
      passwordHash,
    });

    return {
      userId: result.userId,
      email: result.email,
      fullName: result.fullName,
      passwordReset: true,
    };
  } catch (error) {
    mapPasswordResetRequestError(error);
  }
}

/**
 * Nhân viên bấm "Quên mật khẩu" ở màn hình đăng nhập.
 *
 * Luôn trả `accepted: true` kể cả khi email không tồn tại hoặc tài khoản đã
 * ngưng hoạt động — nếu phân biệt hai trường hợp, màn hình đăng nhập trở thành
 * công cụ dò xem email nào có tài khoản trong hệ thống.
 */
export async function requestPasswordResetApproval(
  input: CreatePasswordResetRequestInput,
): Promise<CreatePasswordResetRequestResult> {
  const user = await findUserByEmailForReset(input.email);

  if (user) {
    await createPasswordResetRequest({
      userId: user.id,
      requestedEmail: input.email,
      note: input.note,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  return { accepted: true };
}

export async function listPasswordResetRequests(
  filters: PasswordResetRequestsFilters,
): Promise<PasswordResetRequestListRow[]> {
  return findPasswordResetRequests(filters);
}

/** Duyệt yêu cầu: mật khẩu của nhân viên trở về `DEFAULT_RESET_PASSWORD`. */
export async function approvePasswordResetRequest(
  input: ApprovePasswordResetRequestInput,
): Promise<ApprovePasswordResetRequestResult> {
  const passwordHash = await bcrypt.hash(DEFAULT_RESET_PASSWORD, 12);

  try {
    const result = await approvePasswordResetRequestTransaction({
      requestId: input.requestId,
      approvedBy: input.approvedBy,
      passwordHash,
    });

    return {
      requestId: input.requestId,
      userId: result.userId,
      email: result.email,
      fullName: result.fullName,
      status: 'APPROVED',
    };
  } catch (error) {
    mapPasswordResetRequestError(error);
  }
}

export async function rejectPasswordResetRequest(
  input: RejectPasswordResetRequestInput,
): Promise<RejectPasswordResetRequestResult> {
  try {
    const result = await rejectPasswordResetRequestTransaction(input);

    return {
      requestId: input.requestId,
      userId: result.userId,
      status: 'REJECTED',
    };
  } catch (error) {
    mapPasswordResetRequestError(error);
  }
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const employeeCode = input.employeeCode ?? `USR-${Date.now()}`;

  await createUser({
    roleCode: 'STAFF',
    employeeCode,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    passwordHash,
  });

  return login({ email: input.email, password: input.password });
}

export async function listUsers(): Promise<UserListRow[]> {
  return listUsersRepository();
}

export async function createManagedUser(
  input: CreateUserInput,
): Promise<UserMutationResult> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const employeeCode = input.employeeCode ?? 'USR-' + Date.now();
  const insertId = await createUser({
    roleCode: input.roleCode,
    employeeCode,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    passwordHash,
  });

  return { affectedRows: insertId > 0 ? 1 : 0, insertId };
}

export async function updateUser(
  id: number,
  input: UpdateUserInput,
): Promise<UserMutationResult> {
  const affectedRows = await updateUserRepository(id, input);
  if (affectedRows === 0) {
    throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return { affectedRows };
}

export async function deleteUser(id: number): Promise<UserMutationResult> {
  const affectedRows = await deleteUserRepository(id);
  if (affectedRows === 0) {
    throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
  }
  return { affectedRows };
}
