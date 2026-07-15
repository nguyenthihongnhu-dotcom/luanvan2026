import { authRouter } from './auth.routes';

export const authModule = authRouter;

export { requirePermission } from '../../common/middleware/require-permission.middleware';
export { verifyToken } from './auth.middleware';
export { extractBearerToken, verifyAccessToken } from './auth.service';
export type { AuthUser } from './auth.model';
