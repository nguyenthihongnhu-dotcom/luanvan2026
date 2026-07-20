import type { ReportsFilters, ReportsRow } from './reports.model';
import {
  findInventoryMovementReport,
  findInventoryTransactionReport,
  findNearExpiryReport,
  findProductStockReport,
  findReports as findReportsRepository,
} from './reports.repository';

export async function listReports(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findReportsRepository(filters);
}

export async function listProductStockReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findProductStockReport(filters);
}

export async function listNearExpiryReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findNearExpiryReport(filters);
}

export async function listInventoryMovementReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findInventoryMovementReport(filters);
}

export async function listInventoryTransactionReport(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findInventoryTransactionReport(filters);
}
