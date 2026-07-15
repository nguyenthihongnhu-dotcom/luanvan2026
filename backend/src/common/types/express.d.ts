export type { AuthUser } from '../../modules/auth/auth.model';

declare global {
  namespace Express {
    interface Request {
      user?: import('../../modules/auth/auth.model').AuthUser;
    }
  }
}
