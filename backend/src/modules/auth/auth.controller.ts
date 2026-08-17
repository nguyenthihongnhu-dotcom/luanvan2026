import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  approvePasswordResetRequest,
  listPasswordResetRequests,
  login,
  logout,
  refresh,
  rejectPasswordResetRequest,
  requestPasswordResetApproval,
  resetUserPassword,
  register,
  assignUserWarehouses,
  createManagedUser,
  listUsers,
  updateUser,
  deleteUser,
} from './auth.service';
import {
  parseCreatePasswordResetRequestInput,
  parseLoginInput,
  parseLogoutInput,
  parsePasswordResetRequestId,
  parsePasswordResetRequestsFilters,
  parseRefreshInput,
  parseRejectPasswordResetRequestInput,
  parseRegisterInput,
  parseAssignUserWarehousesInput,
  parseCreateUserInput,
  parseUpdateUserInput,
  parseUserId,
} from './auth.validation';

function requireAuthenticatedUser(req: Request): number {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  return Number(req.user.id);
}

function getRequestMetadata(req: Request): {
  userAgent?: string;
  ipAddress?: string;
} {
  return {
    userAgent: req.header('user-agent'),
    ipAddress: req.ip,
  };
}

export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseLoginInput(req.body, getRequestMetadata(req));

  res.json({ data: await login(input) });
}

export async function refreshController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseRefreshInput(req.body, getRequestMetadata(req));

  res.json({ data: await refresh(input) });
}

export async function logoutController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseLogoutInput(req.body);

  res.json({ data: await logout(input) });
}

/** Quản trị viên đặt lại mật khẩu của một nhân viên về giá trị mặc định. */
export async function resetUserPasswordController(
  req: Request,
  res: Response,
): Promise<void> {
  const resetBy = requireAuthenticatedUser(req);
  const userId = parseUserId(req.params.id);

  res.json({ data: await resetUserPassword({ userId, resetBy }) });
}

export async function createPasswordResetRequestController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreatePasswordResetRequestInput(
    req.body,
    getRequestMetadata(req),
  );

  res.status(201).json({ data: await requestPasswordResetApproval(input) });
}

export async function listPasswordResetRequestsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parsePasswordResetRequestsFilters(req.query);

  res.json({ data: await listPasswordResetRequests(filters) });
}

export async function approvePasswordResetRequestController(
  req: Request,
  res: Response,
): Promise<void> {
  const approvedBy = requireAuthenticatedUser(req);
  const requestId = parsePasswordResetRequestId(req.params.id);

  res.json({
    data: await approvePasswordResetRequest({ requestId, approvedBy }),
  });
}

export async function rejectPasswordResetRequestController(
  req: Request,
  res: Response,
): Promise<void> {
  const rejectedBy = requireAuthenticatedUser(req);
  const requestId = parsePasswordResetRequestId(req.params.id);
  const { rejectionReason } = parseRejectPasswordResetRequestInput(req.body);

  res.json({
    data: await rejectPasswordResetRequest({
      requestId,
      rejectedBy,
      rejectionReason,
    }),
  });
}

export async function registerController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseRegisterInput(req.body);

  res.status(201).json({ data: await register(input) });
}

export async function listUsersController(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await listUsers() });
}

export async function createUserController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateUserInput(req.body);

  res.status(201).json({ data: await createManagedUser(input) });
}

export async function updateUserController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);
  const input = parseUpdateUserInput(req.body);

  res.json({ data: await updateUser(id, input) });
}

export async function assignUserWarehousesController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);
  const input = parseAssignUserWarehousesInput(req.body);

  res.json({ data: await assignUserWarehouses(id, input) });
}

export async function deleteUserController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  res.json({ data: await deleteUser(id) });
}
