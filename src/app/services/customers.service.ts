import { api } from "./apiClient";
import type { Customer, Sale, Payment } from "../store/AppContext";

interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; }

export const customersService = {
  list: (page = 1, limit = 50, search = "") =>
    api.get<PaginatedResponse<Customer>>(`/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  get: (id: string) => api.get<Customer>(`/customers/${id}`),

  create: (c: Omit<Customer, "customer_id">) => api.post<Customer>("/customers", c),

  update: (c: Customer) => api.put<{ ok: boolean }>(`/customers/${c.customer_id}`, c),

  delete: (id: string) => api.delete<{ ok: boolean }>(`/customers/${id}`),

  getSales: (customerId: string) =>
    api.get<PaginatedResponse<Sale>>(`/sales?customerId=${customerId}&limit=100`),

  getPayments: (customerId: string) =>
    api.get<Payment[]>(`/payments?customerId=${customerId}`),
};
