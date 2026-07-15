import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';

describe('App (e2e)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('/ (GET)', async () => {
    await request(app).get('/').expect(200).expect({
      service: 'warehouse-api',
      framework: 'express',
    });
  });
});
