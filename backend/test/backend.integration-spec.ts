import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { closeDatabasePool, db } from '../src/database/db';

describe('Backend integration with MySQL seed data', () => {
  let app: Express;

  beforeAll(async () => {
    app = createApp();
    const [rows] = await db.query<Array<{ total: number }>>(
      "SELECT COUNT(*) AS total FROM users WHERE email = 'admin@bambi.test'",
    );

    if (!rows[0] || rows[0].total === 0) {
      throw new Error(
        'Sample data is missing. Import backend/warehouse_sample_data.sql before running integration tests.',
      );
    }
  });

  afterAll(async () => {
    await closeDatabasePool();
  });

  it('logs in with seeded admin credentials and returns permissions', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@bambi.test', password: '123456' })
      .expect(200);

    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.user.role).toBe('ADMIN');
    expect(response.body.data.user.permissions).toContain(
      'goods_receipts:confirm',
    );
  });

  it('serves seeded current stock data', async () => {
    const response = await request(app).get('/stock/current').expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sku: 'BIM-HUG-M' }),
      ]),
    );
  });

  it('serves seeded inventory transactions for reporting screens', async () => {
    const response = await request(app)
      .get('/inventory-transactions')
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transaction_type: 'RECEIPT' }),
      ]),
    );
  });

  it('serves product stock and near-expiry reports', async () => {
    const productStock = await request(app)
      .get('/reports/product-stock')
      .expect(200);
    const nearExpiry = await request(app)
      .get('/reports/near-expiry')
      .expect(200);

    expect(productStock.body.data.length).toBeGreaterThan(0);
    expect(nearExpiry.body.data.length).toBeGreaterThan(0);
  });
});