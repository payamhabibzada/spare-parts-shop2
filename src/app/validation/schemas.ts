import { z } from "zod";

// ─── Product ─────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(1, "نام الزامی است").max(200),
  category: z.string().min(1, "دسته‌بندی الزامی است"),
  barcode: z.string().max(100).optional().or(z.literal("")),
  buy_price_afn: z.number({ invalid_type_error: "عدد وارد کنید" }).min(0),
  buy_price_usd: z.number({ invalid_type_error: "عدد وارد کنید" }).min(0),
  sell_price_afn: z.number({ invalid_type_error: "عدد وارد کنید" }).min(0),
  sell_price_usd: z.number({ invalid_type_error: "عدد وارد کنید" }).min(0),
  stock: z.number({ invalid_type_error: "عدد وارد کنید" }).int().min(0),
  min_stock: z.number({ invalid_type_error: "عدد وارد کنید" }).int().min(0),
  description: z.string().max(1000).default(""),
});

// ─── Customer ────────────────────────────────
export const customerSchema = z.object({
  name: z.string().min(1, "نام الزامی است").max(200),
  phone: z.string().max(30).default(""),
  address: z.string().max(500).default(""),
  balance_afn: z.number().min(0).default(0),
  balance_usd: z.number().min(0).default(0),
});

// ─── User ────────────────────────────────────
export const userSchema = z.object({
  username: z.string().min(3, "نام کاربری حداقل ۳ کاراکتر").max(50),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر باشد"),
  full_name: z.string().min(1, "نام کامل الزامی است").max(200),
  role: z.enum(["super_admin", "admin", "user"]).default("user"),
  is_active: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

export const userUpdateSchema = userSchema.partial().extend({
  password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر باشد").optional().or(z.literal("")),
});

// ─── Supplier ────────────────────────────────
export const supplierSchema = z.object({
  name: z.string().min(1, "نام الزامی است").max(200),
  company_name: z.string().max(200).default(""),
  phone: z.string().max(30).default(""),
  address: z.string().max(500).default(""),
  balance_afn: z.number().min(0).default(0),
  balance_usd: z.number().min(0).default(0),
});

// ─── ShareHolder ─────────────────────────────
export const shareholderSchema = z.object({
  name: z.string().min(1, "نام الزامی است").max(200),
  phone: z.string().max(30).default(""),
  address: z.string().max(500).default(""),
  investment_amount_afn: z.number().min(0).default(0),
  investment_amount_usd: z.number().min(0).default(0),
  share_percentage: z.number().min(0).max(100).default(0),
  monthly_profit_afn: z.number().min(0).default(0),
  monthly_profit_usd: z.number().min(0).default(0),
  remaining_profit_afn: z.number().min(0).default(0),
  remaining_profit_usd: z.number().min(0).default(0),
});

// ─── Expense ─────────────────────────────────
export const expenseSchema = z.object({
  category: z.string().min(1, "دسته‌بندی الزامی است").max(100),
  description: z.string().max(1000).default(""),
  amount_afn: z.number().min(0).default(0),
  amount_usd: z.number().min(0).default(0),
});

// ─── Withdrawal ──────────────────────────────
export const withdrawalSchema = z.object({
  category: z.enum(["shareholder", "customer"]),
  person_name: z.string().min(1, "نام الزامی است").max(200),
  customer_id: z.string().uuid().optional().nullable(),
  amount_afn: z.number().min(0).default(0),
  amount_usd: z.number().min(0).default(0),
  description: z.string().max(1000).default(""),
});

// ─── Payment ─────────────────────────────────
export const paymentSchema = z.object({
  customer_id: z.string().uuid("مشتری را انتخاب کنید"),
  amount: z.number({ invalid_type_error: "عدد وارد کنید" }).min(0.01, "مبلغ باید بیشتر از صفر باشد"),
  currency: z.enum(["AFN", "USD"]).default("AFN"),
  note: z.string().max(500).default(""),
});

// ─── Login ───────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

// ─── Shop Login ──────────────────────────────
export const shopLoginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;
export type ShareholderFormData = z.infer<typeof shareholderSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
