import type {
  NotificationsFilters,
  NotificationsRow,
} from './notifications.model';
import { findNotifications as findNotificationsRepository } from './notifications.repository';

export async function listNotifications(
  filters: NotificationsFilters,
): Promise<NotificationsRow[]> {
  return findNotificationsRepository(filters);
}
