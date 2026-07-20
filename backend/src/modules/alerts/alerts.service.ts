import type { AlertsFilters, AlertsRow } from './alerts.model';
import {
  findAlerts as findAlertsRepository,
  generateInventoryAlerts as generateInventoryAlertsRepository,
} from './alerts.repository';

export async function listAlerts(filters: AlertsFilters): Promise<AlertsRow[]> {
  return findAlertsRepository(filters);
}

export async function generateAlerts(): Promise<{ createdCount: number }> {
  return generateInventoryAlertsRepository();
}
