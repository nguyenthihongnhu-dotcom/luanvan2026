import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmGoodsIssueController,
  listGoodsIssuesController,
} from './goods-issues.controller';

export const goodsIssuesRouter = Router();

goodsIssuesRouter.get('/', asyncHandler(listGoodsIssuesController));
goodsIssuesRouter.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('goods_issues:confirm'),
  asyncHandler(confirmGoodsIssueController),
);
