import type { Request, Response } from 'express';

const jsonResponse = {
  '200': {
    description: 'Successful response',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiSuccess' },
      },
    },
  },
};

const protectedPost = (summary: string) => ({
  post: {
    summary,
    security: [{ bearerAuth: [] }],
    responses: jsonResponse,
  },
});

const listGet = (summary: string, secured = false) => ({
  get: {
    summary,
    ...(secured ? { security: [{ bearerAuth: [] }] } : {}),
    parameters: [
      { name: 'id', in: 'query', schema: { type: 'integer' } },
      { name: 'search', in: 'query', schema: { type: 'string' } },
      { name: 'warehouseId', in: 'query', schema: { type: 'integer' } },
      { name: 'productVariantId', in: 'query', schema: { type: 'integer' } },
    ],
    responses: jsonResponse,
  },
});

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Bambi WMS API',
    version: '1.0.0',
    description:
      'HTTP API cho hệ thống quản lý kho Mẹ & Bé. Backend dùng Express, TypeScript và MySQL.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Authorization' },
    { name: 'Warehouse' },
    { name: 'Catalog' },
    { name: 'Inventory' },
    { name: 'Documents' },
    { name: 'Reports' },
    { name: 'System' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          data: {
            description: 'Response payload. Shape depends on endpoint.',
          },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      TokenRefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
      LogoutRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string' } },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing, invalid or expired token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
          },
        },
      },
      Forbidden: {
        description: 'Authenticated user does not have required permission',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: { tags: ['Health'], summary: 'API root', responses: jsonResponse },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: jsonResponse,
      },
    },
    '/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'OpenAPI document',
        responses: jsonResponse,
      },
    },
    '/docs': { get: { tags: ['System'], summary: 'Swagger UI' } },

    '/auth/users': listGet('List users'),
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user and issue tokens',
        responses: jsonResponse,
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and issue access/refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: jsonResponse,
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and issue a new access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TokenRefreshRequest' },
            },
          },
        },
        responses: jsonResponse,
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke refresh session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogoutRequest' },
            },
          },
        },
        responses: jsonResponse,
      },
    },
    '/auth/password-reset/request': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset token',
        responses: jsonResponse,
      },
    },
    '/auth/password-reset/reset': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        responses: jsonResponse,
      },
    },

    '/authorization': listGet('List roles and permissions', true),
    '/warehouses': listGet('List warehouses'),
    '/locations': listGet('List warehouse structure and locations'),
    '/locations/zones': {
      post: {
        tags: ['Warehouse'],
        summary: 'Create warehouse zone with default shelves and locations',
        responses: jsonResponse,
      },
    },
    '/locations/shelves': {
      post: {
        tags: ['Warehouse'],
        summary: 'Create shelf with default locations',
        responses: jsonResponse,
      },
    },
    '/catalog': listGet(
      'List categories, brands, units, products and variants',
    ),
    '/suppliers': {
      ...listGet('List suppliers'),
      post: {
        tags: ['Warehouse'],
        summary: 'Create supplier',
        responses: jsonResponse,
      },
    },
    '/suppliers/{id}': {
      put: {
        tags: ['Warehouse'],
        summary: 'Update supplier',
        responses: jsonResponse,
      },
      delete: {
        tags: ['Warehouse'],
        summary: 'Delete supplier',
        responses: jsonResponse,
      },
    },
    '/batches': listGet('List product batches'),
    '/stock/current': listGet('Current stock by location and batch'),
    '/stock/near-expiry': listGet('Near-expiry stock'),
    '/stock/allocation': listGet('Preview FEFO/FIFO allocation'),
    '/inventory-transactions': listGet(
      'List immutable inventory transaction log',
    ),

    '/goods-receipts': {
      ...listGet('List goods receipts'),
      post: {
        tags: ['Documents'],
        summary: 'Create goods receipt header',
        responses: jsonResponse,
      },
    },
    '/goods-receipts/{id}/confirm': protectedPost(
      'Confirm goods receipt and increase stock',
    ),
    '/goods-receipts/{id}/reverse': protectedPost(
      'Reverse confirmed goods receipt',
    ),
    '/goods-issues': {
      ...listGet('List goods issues'),
      post: {
        tags: ['Documents'],
        summary: 'Create goods issue header',
        responses: jsonResponse,
      },
    },
    '/goods-issues/{id}/confirm': protectedPost(
      'Confirm goods issue and decrease stock',
    ),
    '/goods-issues/{id}/reverse': protectedPost(
      'Reverse confirmed goods issue',
    ),
    '/stock-transfers': listGet('List stock transfers'),
    '/stock-transfers/{id}/confirm': protectedPost('Confirm stock transfer'),
    '/stock-transfers/{id}/reverse': protectedPost(
      'Reverse confirmed stock transfer',
    ),
    '/stock-counts': {
      ...listGet('List stock counts'),
      post: {
        tags: ['Inventory'],
        summary: 'Create stock count',
        security: [{ bearerAuth: [] }],
        responses: jsonResponse,
      },
    },
    '/stock-counts/{id}/items': listGet('List stock count items'),
    '/stock-counts/{id}/start': protectedPost('Start stock count'),
    '/stock-counts/{id}/items/{itemId}/count': {
      patch: {
        tags: ['Inventory'],
        summary: 'Record counted quantity',
        security: [{ bearerAuth: [] }],
        responses: jsonResponse,
      },
    },
    '/stock-counts/{id}/submit': protectedPost('Submit stock count'),
    '/stock-counts/{id}/approve': protectedPost('Approve stock count'),
    '/stock-adjustments': {
      ...listGet('List stock adjustments'),
      post: {
        tags: ['Inventory'],
        summary: 'Create stock adjustment header',
        responses: jsonResponse,
      },
    },
    '/stock-adjustments/{id}/approve': protectedPost(
      'Approve stock adjustment',
    ),
    '/stock-adjustments/{id}/reject': protectedPost('Reject stock adjustment'),
    '/stock-adjustments/{id}/cancel': protectedPost('Cancel stock adjustment'),

    '/alerts': listGet('List alerts'),
    '/alerts/generate': protectedPost('Generate inventory alerts'),
    '/notifications': listGet('List notifications', true),
    '/notifications/generate': protectedPost(
      'Generate notifications from alerts',
    ),
    '/audit-logs': listGet('List audit logs', true),
    '/attachments': listGet('List attachments'),
    '/settings': listGet('List application settings'),
    '/reports': listGet('Default report catalog'),
    '/reports/product-stock': listGet('Product stock report'),
    '/reports/near-expiry': listGet('Near-expiry report'),
    '/reports/inventory-movements': listGet('Inventory movement summary'),
    '/reports/inventory-transactions': listGet('Inventory transaction report'),
  },
};

export function getOpenApiJson(_req: Request, res: Response): void {
  res.json(openApiDocument);
}

export function getSwaggerUi(_req: Request, res: Response): void {
  res.type('html').send(`<!doctype html>
<html lang="vi">
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
