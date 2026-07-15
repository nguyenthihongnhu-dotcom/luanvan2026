import { closeDatabasePool, db } from './database/db';

async function main(): Promise<void> {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS location_count FROM warehouse_locations',
    );
    console.log(rows);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await closeDatabasePool();
  }
}

void main();
