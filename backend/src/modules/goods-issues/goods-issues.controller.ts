import type { Request, Response } from 'express';
import { HttpError } from '../../common/http';
import {
  confirmGoodsIssue,
  createGoodsIssue,
  listGoodsIssues,
  reverseGoodsIssue,
  getGoodsIssueDetail,
} from './goods-issues.service';
import {
  parseConfirmGoodsIssueBody,
  parseGoodsIssueId,
  parseGoodsIssuesFilters,
  parseCreateGoodsIssue,
} from './goods-issues.validation';

export async function listGoodsIssuesController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseGoodsIssuesFilters(req.query);

  res.json({ data: await listGoodsIssues(filters) });
}

export async function getGoodsIssueDetailController(
  req: Request,
  res: Response,
): Promise<void> {
  const issueId = parseGoodsIssueId(req.params.id);
  res.json({ data: await getGoodsIssueDetail(issueId) });
}
export async function confirmGoodsIssueController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const issueId = parseGoodsIssueId(req.params.id);
  const body = parseConfirmGoodsIssueBody(req.body);

  res.json({
    data: await confirmGoodsIssue({
      issueId,
      confirmedBy: Number(req.user.id),
      strategy: body.strategy,
    }),
  });
}

export async function reverseGoodsIssueController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  const issueId = parseGoodsIssueId(req.params.id);

  res.json({
    data: await reverseGoodsIssue({
      issueId,
      reversedBy: Number(req.user.id),
    }),
  });
}
export async function createGoodsIssueController(
  req: Request,
  res: Response,
): Promise<void> {
  res
    .status(201)
    .json({ data: await createGoodsIssue(parseCreateGoodsIssue(req.body)) });
}
