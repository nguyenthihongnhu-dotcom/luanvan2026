import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../common/http';
import { config } from '../../config/config';
import type {
  AccessTokenPayload,
  AuthUser,
  LoginInput,
  LoginResult,
  LogoutInput,
  LogoutResult,
  RefreshInput,
  RefreshResult,
  RequestPasswordResetInput,
  RequestPasswordResetResult,
  ResetPasswordInput,
  ResetPasswordResult,
  RegisterInput,
  RegisterResult,
  UserListRow,
  TokenPair,
} from './auth.model';
import {
  createPasswordResetToken,
  createSession,
  findActiveAuthUserById,
  findLoginUserByEmail,
  findUserByEmailForReset,
  markLoginFailure,
  markLoginSuccess,
  resetPasswordWithTokenHash,
  createUser,
  listUsers as listUsersRepository,
  rotateRefreshSession,
  revokeSessionByRefreshHash,
} from './auth.repository';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function toAuthUser(input: {
  id: string | number;
  role_code: string;
  permissions: string | null;
}): AuthUser {
  return {
    id: String(input.id),
    role: input.role_code,
    permissions: input.permissions ? input.permissions.split(',') : [],
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

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<RequestPasswordResetResult> {
  const user = await findUserByEmailForReset(input.email);

  if (!user) {
    return { accepted: true };
  }

  const resetToken = generateOpaqueToken();

  await createPasswordResetToken({
    userId: user.id,
    tokenHash: hashToken(resetToken),
    expiresAt: addMinutes(config.passwordResetTtlMinutes),
  });

  return {
    accepted: true,
    resetToken,
  };
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ResetPasswordResult> {
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  const reset = await resetPasswordWithTokenHash({
    tokenHash: hashToken(input.token),
    passwordHash,
  });

  if (!reset) {
    throw new HttpError(
      401,
      'Invalid or expired reset token',
      'RESET_TOKEN_INVALID',
    );
  }

  return { reset: true };
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const employeeCode = input.employeeCode ?? `USR-${Date.now()}`;

  await createUser({
    roleCode: input.roleCode ?? 'STAFF',
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
