import { Router } from 'express';
import { getOpenApiJson, getSwaggerUi } from './openapi.controller';

export const openApiRouter = Router();

openApiRouter.get('/openapi.json', getOpenApiJson);
openApiRouter.get('/docs', getSwaggerUi);
