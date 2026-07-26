import type { ResultSetHeader } from 'mysql2';
import { db } from '../../database/db';
import type {
  DefaultSettingInput,
  SettingsFilters,
  SettingsRow,
  QueryParams,
  UpdateSettingInput,
} from './settings.model';

const tableName = 'app_settings';

export async function findSettings(
  filters: SettingsFilters,
): Promise<SettingsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('setting_key LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<SettingsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} ORDER BY setting_key ASC LIMIT 100`,
    values: params,
  });

  return rows;
}

export async function seedDefaultSettingsRepository(
  settings: DefaultSettingInput[],
): Promise<number> {
  if (settings.length === 0) return 0;

  const values = settings.map((setting) => [
    setting.settingKey,
    JSON.stringify(setting.settingValue),
    setting.description,
    setting.updatedBy,
  ]);

  const [result] = await db.query<ResultSetHeader>({
    sql: `
      INSERT IGNORE INTO app_settings (setting_key, setting_value, description, updated_by)
      VALUES ?
    `,
    values: [values],
  });

  return result.affectedRows;
}

export async function updateSettingRepository(
  id: number,
  input: UpdateSettingInput,
): Promise<number> {
  const [result] = await db.query<ResultSetHeader>({
    sql: `
      UPDATE app_settings
      SET setting_value = CAST(:settingValue AS JSON),
          description = :description,
          updated_by = :updatedBy
      WHERE id = :id
    `,
    values: {
      id,
      settingValue: JSON.stringify(input.settingValue),
      description: input.description ?? null,
      updatedBy: input.updatedBy,
    },
  });

  return result.affectedRows;
}
