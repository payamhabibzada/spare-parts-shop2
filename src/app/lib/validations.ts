/**
 * Zod Validation Schemas
 * Centralized validation for all forms
 */

import { z } from 'zod';

// ─────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────

export const shopLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const userLoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  ),
  fullName: z.string().min(2).max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
  permissions: z.array(z.string()).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// ─────────────────────────────────────────────
// PRODUCT SCHEMAS
// ─────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().uuid().optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  buyPriceAfn: z.number().min(0).max(999999999),
  buyPriceUsd: z.number().min(0).max(999999999),
  sellPriceAfn: z.number().min(0).max(999999999),
  sellPriceUsd: z.number().min(0).max(999999999),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  description: z.string().max(1000).default(''),
});

export const categorySchema = z.object({
  nameEn: z.string().min(1).max(100),
  nameFa: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
});

// ─────────────────────────────────────────────
// CUSTOMER SCHEMAS
// ─────────────────────────────────────────────

export const customerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional().default(''),
  address: z.string().max(500).optional().default(''),
  balanceAfn: z.number().min(0).optional().default(0),
  balanceUsd: z.number().min(0).optional().default(0),
});

export const paymentSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().min(0.01).max(999999999),
  currency: z.enum(['AFN', 'USD']),
  note: z.string().max(500).optional().default(''),
});

// ─────────────────────────────────────────────
// SALE SCHEMAS
// ─────────────────────────────────────────────

export const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
});

export const saleSchema = z.object({
  customerId: z.string().uuid(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  currency: z.enum(['AFN', 'USD']),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  discount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
});

// ─────────────────────────────────────────────
// SUPPLIER SCHEMAS
// ─────────────────────────────────────────────

export const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  companyName: z.string().max(200).optional().default(''),
  phone: z.string().max(20).optional().default(''),
  address: z.string().max(500).optional().default(''),
});

export const supplierPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  totalAmountAfn: z.number().min(0).default(0),
  totalAmountUsd: z.number().min(0).default(0),
  paidAmountAfn: z.number().min(0).default(0),
  paidAmountUsd: z.number().min(0).default(0),
  items: z.array(z.any()).default([]),
  description: z.string().max(1000).optional().default(''),
});

export const supplierPaymentSchema = z.object({
  supplierId: z.string().uuid(),
  amountAfn: z.number().min(0).default(0),
  amountUsd: z.number().min(0).default(0),
  note: z.string().max(500).optional().default(''),
});

// ─────────────────────────────────────────────
// FINANCIAL SCHEMAS
// ─────────────────────────────────────────────

export const shareholderSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional().default(''),
  address: z.string().max(500).optional().default(''),
  investmentAmountAfn: z.number().min(0).default(0),
  investmentAmountUsd: z.number().min(0).default(0),
  sharePercentage: z.number().min(0).max(100),
});

export const expenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().max(1000).optional().default(''),
  amountAfn: z.number().min(0).default(0),
  amountUsd: z.number().min(0).default(0),
});

export const withdrawalSchema = z.object({
  category: z.enum(['SHAREHOLDER', 'CUSTOMER']),
  personName: z.string().min(1).max(200),
  customerId: z.string().uuid().optional().nullable(),
  amountAfn: z.number().min(0).default(0),
  amountUsd: z.number().min(0).default(0),
  description: z.string().max(1000).optional().default(''),
});

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────

export type ShopLoginInput = z.infer<typeof shopLoginSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type SupplierPurchaseInput = z.infer<typeof supplierPurchaseSchema>;
export type SupplierPaymentInput = z.infer<typeof supplierPaymentSchema>;
export type ShareholderInput = z.infer<typeof shareholderSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
