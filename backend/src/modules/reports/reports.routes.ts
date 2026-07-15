import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listReportsController } from './reports.controller';

export const reportsRouter = Router();

reportsRouter.get('/', asyncHandler(listReportsController));
