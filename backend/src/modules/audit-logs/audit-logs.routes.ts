import { Router } from 'express';
import { requireWarehouseWideRole } from '../../common/access/warehouse-scope';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import { listAuditLogsController } from './audit-logs.controller';

export const auditLogsRouter = Router();

auditLogsRouter.get(
  '/',

  asyncHandler(verifyToken),
  requireWarehouseWideRole,

  asyncHandler(listAuditLogsController),
);
