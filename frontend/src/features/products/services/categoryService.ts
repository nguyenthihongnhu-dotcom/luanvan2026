import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface Category {
    id: number;
    name: string;
    code?: string;
}

type CategoryRow = { id: number; name: string; code: string };

export async function listCategories(): Promise<Category[]> {
    const response = await httpClient.get<{ data: CategoryRow[] }>('/catalog/categories');
    return unwrapData(response).map((row) => ({ id: row.id, name: row.name, code: row.code }));
}

export async function createCategory(name: string): Promise<void> {
    await httpClient.post('/catalog/categories', { name });
}

export async function updateCategory(id: number, name: string): Promise<void> {
    await httpClient.put(`/catalog/categories/${id}`, { name });
}

export async function deleteCategory(id: number): Promise<void> {
    await httpClient.delete(`/catalog/categories/${id}`);
}

export const categoryService = { listCategories, createCategory, updateCategory, deleteCategory };