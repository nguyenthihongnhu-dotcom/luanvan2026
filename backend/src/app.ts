import express from 'express';
import { errorHandler, notFoundHandler } from './common/http';
import { config } from './config/config';
import { alertsModule } from './modules/alerts/alerts.module';
import { authModule } from './modules/auth/auth.module';
import { attachmentsModule } from './modules/attachments/attachments.module';
import { auditLogsModule } from './modules/audit-logs/audit-logs.module';
import { authorizationModule } from './modules/authorization/authorization.module';
import { batchesModule } from './modules/batches/batches.module';
import { catalogModule } from './modules/catalog/catalog.module';
import { goodsIssuesModule } from './modules/goods-issues/goods-issues.module';
import { goodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module';
import { healthModule } from './modules/health/health.module';
import { inventoryTransactionsModule } from './modules/inventory-transactions/inventory-transactions.module';
import { locationsModule } from './modules/locations/locations.module';
import { notificationsModule } from './modules/notifications/notifications.module';
import { reportsModule } from './modules/reports/reports.module';
import { settingsModule } from './modules/settings/settings.module';
import { stockModule } from './modules/stock/stock.module';
import { stockAdjustmentsModule } from './modules/stock-adjustments/stock-adjustments.module';
import { stockCountsModule } from './modules/stock-counts/stock-counts.module';
import { stockTransfersModule } from './modules/stock-transfers/stock-transfers.module';
import { suppliersModule } from './modules/suppliers/suppliers.module';
import { warehousesModule } from './modules/warehouses/warehouses.module';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.corsOrigin);
    res.header(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({
      service: 'warehouse-api',
      framework: 'express',
    });
  });

  app.use('/health', healthModule);
  app.use('/auth', authModule);
  app.use('/authorization', authorizationModule);
  app.use('/warehouses', warehousesModule);
  app.use('/locations', locationsModule);
  app.use('/catalog', catalogModule);
  app.use('/suppliers', suppliersModule);
  app.use('/batches', batchesModule);
  app.use('/stock', stockModule);
  app.use('/inventory-transactions', inventoryTransactionsModule);
  app.use('/goods-receipts', goodsReceiptsModule);
  app.use('/goods-issues', goodsIssuesModule);
  app.use('/stock-transfers', stockTransfersModule);
  app.use('/stock-counts', stockCountsModule);
  app.use('/stock-adjustments', stockAdjustmentsModule);
  app.use('/alerts', alertsModule);
  app.use('/notifications', notificationsModule);
  app.use('/audit-logs', auditLogsModule);
  app.use('/attachments', attachmentsModule);
  app.use('/settings', settingsModule);
  app.use('/reports', reportsModule);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
