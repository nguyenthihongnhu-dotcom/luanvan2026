import type { Express } from 'express';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { createApp } from '../src/app';
import { closeDatabasePool, db } from '../src/database/db';

type ApiResponse<T> = { data: T };
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    role: string;
    permissions: string[];
  };
};
type StockRow = { sku: string };
type InventoryTransactionRow = { transaction_type: string };
type WarehouseRow = { code: string; status: string };

type DataList<T> = T[];

function getResponseData<T>(response: SupertestResponse): T {
  const body = response.body as unknown as ApiResponse<T>;
  return body.data;
}

describe('Backend integration with MySQL seed data', () => {
  let app: Express;

  beforeAll(async () => {
    app = createApp();
    const [rows] = await db.query<Array<{ total: number }>>(
      "SELECT COUNT(*) AS total FROM users WHERE email = 'admin@bambi.test'",
    );

    if (!rows[0] || rows[0].total === 0) {
      throw new Error(
        'Sample data is missing. Import backend/warehouse_management_mysql.sql before running integration tests.',
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
    const data = getResponseData<LoginResponse>(response);

    expect(data.accessToken).toEqual(expect.any(String));
    expect(data.refreshToken).toEqual(expect.any(String));
    expect(data.user.role).toBe('ADMIN');
    expect(data.user.permissions).toContain('goods_receipts:confirm');
  });

  it('serves seeded current stock data', async () => {
    const response = await request(app).get('/stock/current').expect(200);
    const data = getResponseData<DataList<StockRow>>(response);

    expect(data.length).toBeGreaterThan(0);
    expect(data).toEqual(
      expect.arrayContaining([expect.objectContaining({ sku: 'BIM-HUG-M' })]),
    );
  });

  it('serves seeded warehouses for warehouse master screens', async () => {
    const response = await request(app).get('/warehouses').expect(200);
    const data = getResponseData<DataList<WarehouseRow>>(response);

    expect(data.length).toBeGreaterThan(0);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'KHO-HCM-01', status: 'ACTIVE' }),
      ]),
    );
  });
  it('serves seeded inventory transactions for reporting screens', async () => {
    const response = await request(app)
      .get('/inventory-transactions')
      .expect(200);
    const data = getResponseData<DataList<InventoryTransactionRow>>(response);

    expect(data.length).toBeGreaterThan(0);
    expect(data).toEqual(
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
    const productStockData = getResponseData<DataList<unknown>>(productStock);
    const nearExpiryData = getResponseData<DataList<unknown>>(nearExpiry);

    expect(productStockData.length).toBeGreaterThan(0);
    expect(nearExpiryData.length).toBeGreaterThan(0);
  });

  it('serves list of all available permissions and authorization roles', async () => {
    const permissionsResponse = await request(app)
      .get('/authorization/permissions')
      .expect(200);
    const permissionsData =
      getResponseData<DataList<{ code: string }>>(permissionsResponse);

    expect(permissionsData.length).toBeGreaterThan(0);

    const rolesResponse = await request(app).get('/authorization').expect(200);
    const rolesData =
      getResponseData<DataList<{ code: string }>>(rolesResponse);

    expect(rolesData.length).toBeGreaterThan(0);
  });

  it('serves system notifications list and handles mark as read', async () => {
    const notificationsResponse = await request(app)
      .get('/notifications')
      .expect(200);
    const notificationsData = getResponseData<DataList<{ id: number }>>(
      notificationsResponse,
    );

    expect(Array.isArray(notificationsData)).toBe(true);
  });
});
