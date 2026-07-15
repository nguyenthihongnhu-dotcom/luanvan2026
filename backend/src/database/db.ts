import mysql from 'mysql2/promise';
import { config } from '../config/config';

export const db = mysql.createPool({
  uri: config.databaseUrl,
  waitForConnections: true,
  connectionLimit: config.dbConnectionLimit,
  queueLimit: 0,
  decimalNumbers: true,
  namedPlaceholders: true,
});

export async function closeDatabasePool(): Promise<void> {
  await db.end();
}
