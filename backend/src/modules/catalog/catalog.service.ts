import { HttpError } from '../../common/http';
import type {
  CatalogFilters,
  CatalogRow,
  CategoryInput,
  MutationResult,
  ProductInput,
} from './catalog.model';
import {
  countProductDocumentReferences,
  countProductStock,
  findCatalog as findCatalogRepository,
  findCategories,
  findProducts,
  insertCategory,
  insertProduct,
  softDeleteCategory,
  softDeleteProduct,
  updateCategory as updateCategoryRepository,
  updateProduct as updateProductRepository,
} from './catalog.repository';

export async function listCatalog(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  return findCatalogRepository(filters);
}

export async function listCategories(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  return findCategories(filters);
}

export async function createCategory(
  input: CategoryInput,
): Promise<{ id: number }> {
  return insertCategory(input);
}

export async function updateCategory(
  id: number,
  input: CategoryInput,
): Promise<MutationResult> {
  return updateCategoryRepository(id, input);
}

export async function deleteCategory(id: number): Promise<MutationResult> {
  return softDeleteCategory(id);
}

export async function listProducts(
  filters: CatalogFilters,
): Promise<CatalogRow[]> {
  return findProducts(filters);
}

export async function createProduct(
  input: ProductInput,
): Promise<{ id: number }> {
  return insertProduct(input);
}

export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<MutationResult> {
  return updateProductRepository(id, input);
}

export async function deleteProduct(id: number): Promise<MutationResult> {
  const documentCount = await countProductDocumentReferences(id);
  if (documentCount > 0) {
    throw new HttpError(
      409,
      `Cannot delete product because ${documentCount} inventory document line(s) reference it`,
      'PRODUCT_HAS_DOCUMENTS',
    );
  }

  const stock = await countProductStock(id);
  if (stock > 0) {
    throw new HttpError(
      409,
      `Cannot delete product because ${stock} unit(s) are still in stock`,
      'PRODUCT_HAS_STOCK',
    );
  }

  return softDeleteProduct(id);
}
