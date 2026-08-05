import { Router } from 'express';
import { asyncHandler } from '../../common/http';
import { requirePermission, verifyToken } from '../auth/auth.module';
import {
  confirmGoodsIssueController,
  listGoodsIssuesController,
  createGoodsIssueController,
  getGoodsIssueDetailController,
  reverseGoodsIssueController,
} from './goods-issues.controller';

export const goodsIssuesRouter = Router();

goodsIssuesRouter.get('/', asyncHandler(listGoodsIssuesController));
goodsIssuesRouter.get('/:id', asyncHandler(getGoodsIssueDetailController));
goodsIssuesRouter.post(
  '/',
  asyncHandler(verifyToken),
  asyncHandler(createGoodsIssueController),
);
goodsIssuesRouter.post(
  '/:id/confirm',
  asyncHandler(verifyToken),
  requirePermission('goods_issues:confirm'),
  asyncHandler(confirmGoodsIssueController),
);
goodsIssuesRouter.post(
  '/:id/reverse',
  asyncHandler(verifyToken),
  requirePermission('goods_issues:reverse'),
  asyncHandler(reverseGoodsIssueController),
);
