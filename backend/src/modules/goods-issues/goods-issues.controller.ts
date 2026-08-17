import type { Request, Response } from 'express';
import {
  isWarehouseInScope,
  resolveWarehouseScope,
} from '../../common/access/warehouse-scope';
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
  const warehouseScope = await resolveWarehouseScope(req.user);

  res.json({ data: await listGoodsIssues({ ...filters, warehouseScope }) });
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
  const input = parseCreateGoodsIssue(req.body);
  const warehouseScope = await resolveWarehouseScope(req.user);
  if (!isWarehouseInScope(warehouseScope, input.warehouseId)) {
    throw new HttpError(
      403,
      'Bạn không phụ trách kho này nên không tạo được chứng từ cho nó',
      'WAREHOUSE_OUT_OF_SCOPE',
    );
  }

  const createdBy =
    input.createdBy ?? (req.user ? Number(req.user.id) : undefined);
  res.status(201).json({
    data: await createGoodsIssue({
      ...input,
      createdBy,
    }),
  });
}
