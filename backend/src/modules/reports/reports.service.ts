import type { ReportsFilters, ReportsRow } from './reports.model';
import { findReports as findReportsRepository } from './reports.repository';

export async function listReports(
  filters: ReportsFilters,
): Promise<ReportsRow[]> {
  return findReportsRepository(filters);
}
