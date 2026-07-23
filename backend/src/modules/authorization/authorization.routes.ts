import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import {
  listAuthorizationController,
  listAllPermissionsController,
  updateRolePermissionsController,
} from './authorization.controller';

export const authorizationRouter = Router();

authorizationRouter.get('/', asyncHandler(listAuthorizationController));
authorizationRouter.get('/permissions', asyncHandler(listAllPermissionsController));
authorizationRouter.put('/roles/:id/permissions', asyncHandler(updateRolePermissionsController));

