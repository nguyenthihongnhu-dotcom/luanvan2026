import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listAuditLogsController } from './audit-logs.controller';

export const auditLogsRouter = Router();

auditLogsRouter.get('/', asyncHandler(listAuditLogsController));
