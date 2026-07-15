import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listAuthorizationController } from './authorization.controller';

export const authorizationRouter = Router();

authorizationRouter.get('/', asyncHandler(listAuthorizationController));
