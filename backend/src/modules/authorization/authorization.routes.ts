import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  listAuthorizationController,
  listAllPermissionsController,
  updateRolePermissionsController,
} from './authorization.controller';

export const authorizationRouter = Router();

authorizationRouter.get(
  '/',
  asyncHandler(verifyToken),
  requirePermission('authorization:read'),
  asyncHandler(listAuthorizationController),
);
authorizationRouter.get(
  '/permissions',
  asyncHandler(verifyToken),
  requirePermission('authorization:read'),
  asyncHandler(listAllPermissionsController),
);
authorizationRouter.put(
  '/roles/:id/permissions',
  asyncHandler(verifyToken),
  requirePermission('authorization:update'),
  asyncHandler(updateRolePermissionsController),
);
