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
import { generateNotifications } from '../notifications/notifications.service';

export async function listAlerts(filters: AlertsFilters): Promise<AlertsRow[]> {
  return findAlertsRepository(filters);
}

export async function generateAlerts(): Promise<{
  createdCount: number;
  resolvedCount: number;
}> {
  return generateInventoryAlertsRepository();
}

/**
 * Quét lại cảnh báo tồn ngay sau khi một chứng từ vừa làm thay đổi tồn kho, thay
 * vì chờ người dùng bấm nút "Sinh cảnh báo" trên màn Cảnh báo. Sinh xong cảnh báo
 * thì đẩy tiếp thành thông báo, vì cảnh báo nằm im trong bảng `alerts` sẽ không
 * tới được người vận hành.
 *
 * Gọi sau khi giao dịch của chứng từ đã commit, và nuốt lỗi có chủ đích: phiếu đã
 * ghi thành công rồi thì không được trả lỗi cho người dùng chỉ vì bước sinh cảnh
 * báo hỏng.
 */
export async function syncInventoryAlerts(source: string): Promise<void> {
  try {
    const { createdCount } = await generateInventoryAlertsRepository();
    if (createdCount > 0) {
      await generateNotifications();
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Sinh cảnh báo/thông báo tồn kho thất bại',
        source,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
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
