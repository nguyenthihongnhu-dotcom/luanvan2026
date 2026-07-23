import type {
  NotificationMutationResult,
  NotificationsFilters,
  NotificationsRow,
} from './notifications.model';
import {
  findNotifications as findNotificationsRepository,
  generateNotificationsFromAlerts,
  markNotificationReadRepository,
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

export async function markNotificationRead(
  notificationId: number,
  userId: number,
): Promise<NotificationMutationResult> {
  return markNotificationReadRepository(notificationId, userId);
}
