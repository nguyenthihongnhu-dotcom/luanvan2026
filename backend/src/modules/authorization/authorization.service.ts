import type {
  AuthorizationFilters,
  AuthorizationRow,
} from './authorization.model';
import { findAuthorization as findAuthorizationRepository } from './authorization.repository';

export async function listAuthorization(
  filters: AuthorizationFilters,
): Promise<AuthorizationRow[]> {
  return findAuthorizationRepository(filters);
}
