import type { Request, Response } from 'express';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listCatalog,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} from './catalog.service';
import {
  parseCatalogFilters,
  parseCatalogId,
  parseCategoryInput,
  parseProductInput,
} from './catalog.validation';

export async function listCatalogController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseCatalogFilters(req.query);
  res.json({ data: await listCatalog(filters) });
}

export async function listCategoriesController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await listCategories(parseCatalogFilters(req.query)) });
}

export async function createCategoryController(
  req: Request,
  res: Response,
): Promise<void> {
  res
    .status(201)
    .json({ data: await createCategory(parseCategoryInput(req.body)) });
}

export async function updateCategoryController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({
    data: await updateCategory(
      parseCatalogId(req.params.id),
      parseCategoryInput(req.body),
    ),
  });
}

export async function deleteCategoryController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await deleteCategory(parseCatalogId(req.params.id)) });
}

export async function listProductsController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await listProducts(parseCatalogFilters(req.query)) });
}

export async function createProductController(
  req: Request,
  res: Response,
): Promise<void> {
  res
    .status(201)
    .json({ data: await createProduct(parseProductInput(req.body)) });
}

export async function updateProductController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({
    data: await updateProduct(
      parseCatalogId(req.params.id),
      parseProductInput(req.body),
    ),
  });
}

export async function deleteProductController(
  req: Request,
  res: Response,
): Promise<void> {
  res.json({ data: await deleteProduct(parseCatalogId(req.params.id)) });
}
