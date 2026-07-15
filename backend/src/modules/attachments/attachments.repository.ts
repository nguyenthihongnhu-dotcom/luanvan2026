import { db } from '../../database/db';
import type {
  AttachmentsFilters,
  AttachmentsRow,
  QueryParams,
} from './attachments.model';

const tableName = 'attachments';

export async function findAttachments(
  filters: AttachmentsFilters,
): Promise<AttachmentsRow[]> {
  const where: string[] = [];
  const params: QueryParams = {};

  if (filters.id) {
    where.push('id = :id');
    params.id = filters.id;
  }

  if (filters.search) {
    where.push('file_name LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.query<AttachmentsRow[]>({
    sql: `SELECT * FROM ${tableName} ${whereSql} LIMIT 100`,
    values: params,
  });

  return rows;
}
