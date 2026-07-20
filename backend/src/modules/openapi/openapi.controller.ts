import type { Request, Response } from 'express';

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Bambi WMS API',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': { get: { summary: 'Health check' } },
    '/auth/login': { post: { summary: 'Login' } },
    '/auth/refresh': { post: { summary: 'Refresh token' } },
    '/auth/logout': { post: { summary: 'Logout' } },
    '/stock/current': { get: { summary: 'Current stock' } },
    '/stock/near-expiry': { get: { summary: 'Near expiry stock' } },
    '/stock/allocation': { get: { summary: 'Allocation preview' } },
    '/goods-receipts/{id}/confirm': {
      post: {
        summary: 'Confirm goods receipt',
        security: [{ bearerAuth: [] }],
      },
    },
    '/goods-receipts/{id}/reverse': {
      post: {
        summary: 'Reverse goods receipt',
        security: [{ bearerAuth: [] }],
      },
    },
    '/goods-issues/{id}/confirm': {
      post: { summary: 'Confirm goods issue', security: [{ bearerAuth: [] }] },
    },
    '/goods-issues/{id}/reverse': {
      post: { summary: 'Reverse goods issue', security: [{ bearerAuth: [] }] },
    },
    '/stock-transfers/{id}/confirm': {
      post: {
        summary: 'Confirm stock transfer',
        security: [{ bearerAuth: [] }],
      },
    },
    '/stock-transfers/{id}/reverse': {
      post: {
        summary: 'Reverse stock transfer',
        security: [{ bearerAuth: [] }],
      },
    },
    '/stock-counts': {
      get: { summary: 'List stock counts' },
      post: { summary: 'Create stock count', security: [{ bearerAuth: [] }] },
    },
    '/stock-counts/{id}/items': { get: { summary: 'List stock count items' } },
    '/stock-counts/{id}/start': {
      post: { summary: 'Start stock count', security: [{ bearerAuth: [] }] },
    },
    '/stock-counts/{id}/items/{itemId}/count': {
      patch: {
        summary: 'Record counted quantity',
        security: [{ bearerAuth: [] }],
      },
    },
    '/stock-counts/{id}/submit': {
      post: { summary: 'Submit stock count', security: [{ bearerAuth: [] }] },
    },
    '/stock-counts/{id}/approve': {
      post: { summary: 'Approve stock count', security: [{ bearerAuth: [] }] },
    },
    '/stock-adjustments/{id}/approve': {
      post: {
        summary: 'Approve stock adjustment',
        security: [{ bearerAuth: [] }],
      },
    },
    '/stock-adjustments/{id}/reject': {
      post: {
        summary: 'Reject stock adjustment',
        security: [{ bearerAuth: [] }],
      },
    },
    '/stock-adjustments/{id}/cancel': {
      post: {
        summary: 'Cancel stock adjustment',
        security: [{ bearerAuth: [] }],
      },
    },
    '/alerts/generate': {
      post: {
        summary: 'Generate inventory alerts',
        security: [{ bearerAuth: [] }],
      },
    },
    '/notifications/generate': {
      post: {
        summary: 'Generate notifications from alerts',
        security: [{ bearerAuth: [] }],
      },
    },
    '/reports/product-stock': { get: { summary: 'Product stock report' } },
    '/reports/near-expiry': { get: { summary: 'Near expiry report' } },
    '/reports/inventory-movements': {
      get: { summary: 'Inventory movement summary' },
    },
    '/reports/inventory-transactions': {
      get: { summary: 'Inventory transaction report' },
    },
  },
};

export function getOpenApiJson(_req: Request, res: Response): void {
  res.json(openApiDocument);
}

export function getSwaggerUi(_req: Request, res: Response): void {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bambi WMS API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });</script>
</body>
</html>`);
}
