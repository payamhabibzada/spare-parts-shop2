import { api } from "./apiClient";
import type { Product } from "../store/AppContext";

interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; }

export const productsService = {
  list: (page = 1, limit = 50, search = "") =>
    api.get<PaginatedResponse<Product>>(`/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  get: (id: string) => api.get<Product>(`/products/${id}`),

  create: (p: Omit<Product, "product_id">) => api.post<Product>("/products", p),

  update: (p: Product) => api.put<{ ok: boolean }>(`/products/${p.product_id}`, p),

  delete: (id: string) => api.delete<{ ok: boolean }>(`/products/${id}`),
};
