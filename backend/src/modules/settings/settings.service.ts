import { HttpError } from '../../common/http';
import type {
  DefaultSettingInput,
  SettingMutationResult,
  SettingsFilters,
  SettingsRow,
  UpdateSettingInput,
} from './settings.model';
import {
  findSettings as findSettingsRepository,
  seedDefaultSettingsRepository,
  updateSettingRepository,
} from './settings.repository';

const defaultSettings: Omit<DefaultSettingInput, 'updatedBy'>[] = [
  {
    settingKey: 'warehouse.default_code',
    settingValue: 'HCM01',
    description: 'Mã kho mặc định khi tạo dữ liệu vận hành.',
  },
  {
    settingKey: 'stock.low_stock_threshold_percent',
    settingValue: 20,
    description:
      'Ngưỡng cảnh báo tồn thấp theo phần trăm so với tồn tối thiểu.',
  },
  {
    settingKey: 'stock.expiry_warning_days',
    settingValue: 30,
    description: 'Số ngày trước hạn dùng để sinh cảnh báo hàng gần hết hạn.',
  },
  {
    settingKey: 'quick_receive.require_lot_number',
    settingValue: false,
    description: 'Bắt buộc nhập lô hàng khi nhập nhanh bằng QR.',
  },
  {
    settingKey: 'notifications.auto_generate_from_alerts',
    settingValue: true,
    description: 'Tự động sinh thông báo từ cảnh báo vận hành kho.',
  },
];

export async function listSettings(
  filters: SettingsFilters,
): Promise<SettingsRow[]> {
  return findSettingsRepository(filters);
}

export async function seedDefaultSettings(
  updatedBy: number,
): Promise<SettingMutationResult> {
  const affectedRows = await seedDefaultSettingsRepository(
    defaultSettings.map((setting) => ({ ...setting, updatedBy })),
  );
  return { affectedRows };
}

export async function updateSetting(
  id: number,
  input: UpdateSettingInput,
): Promise<SettingMutationResult> {
  const affectedRows = await updateSettingRepository(id, input);
  if (affectedRows === 0) {
    throw new HttpError(404, 'Setting not found', 'SETTING_NOT_FOUND');
  }
  return { affectedRows };
}
