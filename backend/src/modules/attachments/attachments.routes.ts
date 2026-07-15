import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { listAttachmentsController } from './attachments.controller';

export const attachmentsRouter = Router();

attachmentsRouter.get('/', asyncHandler(listAttachmentsController));
