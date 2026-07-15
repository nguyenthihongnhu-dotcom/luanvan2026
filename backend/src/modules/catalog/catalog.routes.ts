import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listCatalogController } from './catalog.controller';

export const catalogRouter = Router();

catalogRouter.get('/', asyncHandler(listCatalogController));
