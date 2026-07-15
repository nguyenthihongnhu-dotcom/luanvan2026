import type { CatalogFilters, CatalogRow } from './catalog.model';
import { findCatalog as findCatalogRepository } from './catalog.repository';

export async function listCatalog(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  return findCatalogRepository(filters);
}
