import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listSuppliersController } from './suppliers.controller';

export const suppliersRouter = Router();

suppliersRouter.get('/', asyncHandler(listSuppliersController));
