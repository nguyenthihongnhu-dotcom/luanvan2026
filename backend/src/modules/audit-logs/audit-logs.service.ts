import type { AuditLogsFilters, AuditLogsRow } from './audit-logs.model';
import { findAuditLogs as findAuditLogsRepository } from './audit-logs.repository';

export async function listAuditLogs(
  filters: AuditLogsFilters,
): Promise<AuditLogsRow[]> {
  return findAuditLogsRepository(filters);
}
