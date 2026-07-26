import type {
  NotificationMutationResult,
  NotificationsFilters,
  NotificationsRow,
} from './notifications.model';
import {
  findNotifications as findNotificationsRepository,
  generateNotificationsFromAlerts,
  markAllNotificationsReadRepository,
  markNotificationReadRepository,
} from './notifications.repository';

import { emitNotificationToUser } from '../../socket/socket';

export async function listNotifications(
  filters: NotificationsFilters,
): Promise<NotificationsRow[]> {
  return findNotificationsRepository(filters);
}

export async function generateNotifications(): Promise<{
  createdCount: number;
}> {
  const result = await generateNotificationsFromAlerts();
  if (result.createdNotifications.length > 0) {
    for (const item of result.createdNotifications) {
      if (item.user_id != null) {
        emitNotificationToUser(item.user_id as number, item);
      }
    }
  }
  return { createdCount: result.createdCount };
}

export async function markNotificationRead(
  notificationId: number,
  userId: number,
): Promise<NotificationMutationResult> {
  return markNotificationReadRepository(notificationId, userId);
}

export function markAllNotificationsRead(
  userId: number,
): Promise<NotificationMutationResult> {
  return markAllNotificationsReadRepository(userId);
}
