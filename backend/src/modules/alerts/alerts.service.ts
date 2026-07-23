import type {
  AlertMutationResult,
  AlertsFilters,
  AlertsRow,
} from './alerts.model';
import {
  findAlerts as findAlertsRepository,
  generateInventoryAlerts as generateInventoryAlertsRepository,
  markAlertReadRepository,
  resolveAlertRepository,
} from './alerts.repository';

export async function listAlerts(filters: AlertsFilters): Promise<AlertsRow[]> {
  return findAlertsRepository(filters);
}

export async function generateAlerts(): Promise<{ createdCount: number }> {
  return generateInventoryAlertsRepository();
}

export async function markAlertRead(
  alertId: number,
): Promise<AlertMutationResult> {
  return markAlertReadRepository(alertId);
}

export async function resolveAlert(
  alertId: number,
  resolvedBy: number,
): Promise<AlertMutationResult> {
  return resolveAlertRepository(alertId, resolvedBy);
}
