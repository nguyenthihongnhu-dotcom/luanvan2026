import { db } from '../../database/db';

export type HealthStatus = {
  status: 'ok';
  database: 'ok';
  service: 'warehouse-api';
};

export async function getHealthStatus(): Promise<HealthStatus> {
  await db.query('SELECT 1');

  return {
    status: 'ok',
    database: 'ok',
    service: 'warehouse-api',
  };
}
