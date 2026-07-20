import type {
  NotificationsFilters,
  NotificationsRow,
} from './notifications.model';
import {
  findNotifications as findNotificationsRepository,
  generateNotificationsFromAlerts,
} from './notifications.repository';

export async function listNotifications(
  filters: NotificationsFilters,
): Promise<NotificationsRow[]> {
  return findNotificationsRepository(filters);
}

export async function generateNotifications(): Promise<{
  createdCount: number;
}> {
  return generateNotificationsFromAlerts();
}
