import { db } from '../../database/db';
import type {
  SettingsFilters,
  SettingsRow,
  QueryParams,
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
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
