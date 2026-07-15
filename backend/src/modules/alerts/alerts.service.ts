import type { AlertsFilters, AlertsRow } from './alerts.model';
import { findAlerts as findAlertsRepository } from './alerts.repository';

export async function listAlerts(filters: AlertsFilters): Promise<AlertsRow[]> {
  return findAlertsRepository(filters);
}
