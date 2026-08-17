import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { verifyToken } from '../auth/auth.module';
import { listAttachmentsController } from './attachments.controller';

export const attachmentsRouter = Router();

attachmentsRouter.get(
  '/',

  asyncHandler(verifyToken),

  asyncHandler(listAttachmentsController),
);
