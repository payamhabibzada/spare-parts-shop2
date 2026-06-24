import React, { createContext, useContext, useState, useEffect } from "react";
import { useShopUser } from "./ShopUserContext";

// Language and Currency Types
export type Language = "fa" | "en" | "ps";
export type Currency = "AFN" | "USD";

export interface Product {
  product_id: string;
  name: string;
  category: string;
  buy_price_afn: number;
  buy_price_usd: number;
  sell_price_afn: number;
  sell_price_usd: number;
  stock: number;
  min_stock: number; // حداقل موجودی
  description: string;
  barcode?: string;
}

export interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  address: string;
  balance_afn: number;
  balance_usd: number;
}

export interface Sale {
  sale_id: string;
  customer_id: string;
  date: string;
  time?: string;
  invoice_number?: string;
  currency: Currency;
  total_amount: number;
  discount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status?: "paid" | "credit" | "partial";
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface Payment {
  payment_id: string;
  customer_id: string;
  amount: number;
  currency: Currency;
  date: string;
  note: string;
}

export interface Withdrawal {
  withdrawal_id: string;
  category: "shareholder" | "customer";
  person_name: string;
  customer_id?: string; // For customer category
  amount_afn: number;
  amount_usd: number;
  date: string;
  description: string;
}

export interface Expense {
  expense_id: string;
  date: string;
  category: string;
  description: string;
  amount_afn: number;
  amount_usd: number;
}

export interface ShareHolder {
  shareholder_id: string;
  name: string;
  investment_amount_afn: number;
  investment_amount_usd: number;
  share_percentage: number;
  phone: string;
  address: string;
  monthly_profit_afn: number;
  monthly_profit_usd: number;
  remaining_profit_afn: number;
  remaining_profit_usd: number;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: "super_admin" | "admin" | "user";
  is_active: boolean;
  permissions: string[]; // [] = no access, ["*"] = full access
}

export interface ActivityLog {
  log_id: string;
  user_id: string;
  username: string;
  full_name: string;
  action: "add" | "edit" | "delete";
  entity: string;
  entity_name: string;
  entity_id?: string;
  description: string;
  before_data?: string;
  after_data?: string;
  date: string;
  time: string;
}

export interface Category {
  category_id: string;
  name_fa: string;
  name_en: string;
  description: string;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  company_name: string;
  phone: string;
  address: string;
  balance_afn: number;
  balance_usd: number;
}

export interface SupplierPurchase {
  purchase_id: string;
  supplier_id: string;
  date: string;
  total_amount_afn: number;
  total_amount_usd: number;
  paid_amount_afn: number;
  paid_amount_usd: number;
  items: string; // JSON string of items
  description: string;
}

export interface SupplierPayment {
  payment_id: string;
  supplier_id: string;
  amount_afn: number;
  amount_usd: number;
  date: string;
  note: string;
}

interface AppContextType {
  // Language & Currency
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;

  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Products
  products: Product[];
  addProduct: (p: Omit<Product, "product_id">) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, "category_id">) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "customer_id">) => void;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;

  // Sales
  sales: Sale[];
  saleItems: SaleItem[];
  addSale: (sale: Omit<Sale, "sale_id">, items: Omit<SaleItem, "id" | "sale_id">[]) => void;
  deleteSale: (id: string) => void;
  getSaleItems: (saleId: string) => SaleItem[];
  getCustomerSales: (customerId: string) => Sale[];

  // Payments
  payments: Payment[];
  addPayment: (p: Omit<Payment, "payment_id">) => void;
  deletePayment: (id: string) => void;
  getCustomerPayments: (customerId: string) => Payment[];

  // Withdrawals
  withdrawals: Withdrawal[];
  addWithdrawal: (w: Omit<Withdrawal, "withdrawal_id">) => void;
  deleteWithdrawal: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (e: Omit<Expense, "expense_id">) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;

  // Shareholders
  shareholders: ShareHolder[];
  addShareHolder: (s: Omit<ShareHolder, "shareholder_id">) => void;
  updateShareHolder: (s: ShareHolder) => void;
  deleteShareHolder: (id: string) => void;

  // Users
  users: User[];
  addUser: (u: Omit<User, "user_id">) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;

  // Activity Logs
  activityLogs: ActivityLog[];
  logActivity: (action: "add" | "edit" | "delete", entity: string, entityName: string, description: string, entityId?: string, beforeData?: object, afterData?: object) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (s: Omit<Supplier, "supplier_id">) => void;
  updateSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;

  // Supplier Purchases
  supplierPurchases: SupplierPurchase[];
  addSupplierPurchase: (p: Omit<SupplierPurchase, "purchase_id">) => void;
  deleteSupplierPurchase: (id: string) => void;

  // Supplier Payments
  supplierPayments: SupplierPayment[];
  addSupplierPayment: (p: Omit<SupplierPayment, "payment_id">) => void;
  deleteSupplierPayment: (id: string) => void;

  // Cash Management
  cashAfn: number;
  cashUsd: number;
  updateCash: (amountAfn: number, amountUsd: number) => void;
}

const initialProducts: Product[] = [
  { product_id: "p1", name: "تلویزیون سامسونگ ۴۳ اینچ", category: "برقی", buy_price_afn: 12000, buy_price_usd: 170, sell_price_afn: 14500, sell_price_usd: 205, stock: 5, min_stock: 2, description: "تلویزیون هوشمند ۴K" },
  { product_id: "p2", name: "یخچال ال‌جی ۲۰ فوت", category: "آشپزخانه", buy_price_afn: 18000, buy_price_usd: 255, sell_price_afn: 22000, sell_price_usd: 310, stock: 3, min_stock: 1, description: "یخچال دو درب" },
  { product_id: "p3", name: "ماشین لباسشویی سامسونگ", category: "آشپزخانه", buy_price_afn: 14000, buy_price_usd: 200, sell_price_afn: 17000, sell_price_usd: 240, stock: 4, min_stock: 2, description: "۷ کیلوگرام تمام اتوماتیک" },
  { product_id: "p4", name: "کولر اسپلیت گری", category: "برقی", buy_price_afn: 8500, buy_price_usd: 120, sell_price_afn: 11000, sell_price_usd: 155, stock: 8, min_stock: 3, description: "۱.۵ تن سرد و گرم" },
  { product_id: "p5", name: "مایکروویو پاناسونیک", category: "آشپزخانه", buy_price_afn: 3500, buy_price_usd: 50, sell_price_afn: 4500, sell_price_usd: 65, stock: 10, min_stock: 3, description: "۲۵ لیتر با گریل" },
  { product_id: "p6", name: "اتو بخار فیلیپس", category: "خانگی", buy_price_afn: 1200, buy_price_usd: 17, sell_price_afn: 1600, sell_price_usd: 23, stock: 15, min_stock: 5, description: "۲۴۰۰ وات ضد رسوب" },
  { product_id: "p7", name: "جاروبرقی دیوو", category: "خانگی", buy_price_afn: 3200, buy_price_usd: 45, sell_price_afn: 4200, sell_price_usd: 60, stock: 7, min_stock: 3, description: "۲۰۰۰ وات با فیلتر هپا" },
  { product_id: "p8", name: "آب‌سردکن پاکشوما", category: "آشپزخانه", buy_price_afn: 4500, buy_price_usd: 65, sell_price_afn: 6000, sell_price_usd: 85, stock: 6, min_stock: 2, description: "سرد و گرم با کمپرسور" },
  { product_id: "p9", name: "تلویزیون ال‌جی ۵۵ اینچ", category: "برقی", buy_price_afn: 22000, buy_price_usd: 310, sell_price_afn: 27000, sell_price_usd: 380, stock: 2, min_stock: 1, description: "OLED 4K HDR" },
  { product_id: "p10", name: "پنکه دیواری اریکه", category: "برقی", buy_price_afn: 900, buy_price_usd: 13, sell_price_afn: 1300, sell_price_usd: 18, stock: 20, min_stock: 5, description: "۳ سرعته با ریموت" },
];

const initialCustomers: Customer[] = [
  { customer_id: "c1", name: "احمد نوری", phone: "0799123456", address: "کابل، شهر نو", balance_afn: 5000, balance_usd: 0 },
  { customer_id: "c2", name: "محمد رحیمی", phone: "0700234567", address: "کابل، مکروریان", balance_afn: 0, balance_usd: 0 },
  { customer_id: "c3", name: "فاطمه صدیقی", phone: "0789345678", address: "کابل، خیرخانه", balance_afn: 12000, balance_usd: 0 },
  { customer_id: "c4", name: "عبدالرحمان حیدری", phone: "0701456789", address: "کابل، قلعه وزیر", balance_afn: 0, balance_usd: 0 },
  { customer_id: "c5", name: "نصرالله محمدی", phone: "0786567890", address: "کابل، دشت برچی", balance_afn: 8500, balance_usd: 0 },
  { customer_id: "c6", name: "زهرا احمدی", phone: "0796678901", address: "کابل، چهار راهی قمبر", balance_afn: 3200, balance_usd: 0 },
];

const initialSales: Sale[] = [
  { sale_id: "s1", customer_id: "c1", date: "2026-04-01", currency: "AFN", total_amount: 14500, discount: 0, paid_amount: 10000, remaining_amount: 4500 },
  { sale_id: "s2", customer_id: "c3", date: "2026-04-05", currency: "AFN", total_amount: 22000, discount: 0, paid_amount: 10000, remaining_amount: 12000 },
  { sale_id: "s3", customer_id: "c5", date: "2026-04-10", currency: "AFN", total_amount: 17000, discount: 0, paid_amount: 8500, remaining_amount: 8500 },
  { sale_id: "s4", customer_id: "c2", date: "2026-04-12", currency: "AFN", total_amount: 11000, discount: 0, paid_amount: 11000, remaining_amount: 0 },
  { sale_id: "s5", customer_id: "c6", date: "2026-04-15", currency: "AFN", total_amount: 10700, discount: 0, paid_amount: 7500, remaining_amount: 3200 },
  { sale_id: "s6", customer_id: "c4", date: "2026-04-18", currency: "AFN", total_amount: 4500, discount: 0, paid_amount: 4500, remaining_amount: 0 },
  { sale_id: "s7", customer_id: "c1", date: "2026-04-20", currency: "AFN", total_amount: 1600, discount: 0, paid_amount: 1100, remaining_amount: 500 },
  { sale_id: "s8", customer_id: "c2", date: "2026-04-22", currency: "AFN", total_amount: 6000, discount: 0, paid_amount: 6000, remaining_amount: 0 },
];

const initialSaleItems: SaleItem[] = [
  { id: "si1", sale_id: "s1", product_id: "p1", quantity: 1, price: 14500 },
  { id: "si2", sale_id: "s2", product_id: "p2", quantity: 1, price: 22000 },
  { id: "si3", sale_id: "s3", product_id: "p3", quantity: 1, price: 17000 },
  { id: "si4", sale_id: "s4", product_id: "p4", quantity: 1, price: 11000 },
  { id: "si5", sale_id: "s5", product_id: "p4", quantity: 1, price: 11000 },
  { id: "si6", sale_id: "s5", product_id: "p5", quantity: 1, price: 4500 },
  { id: "si7", sale_id: "s5", product_id: "p6", quantity: 1, price: 1600 },
  { id: "si8", sale_id: "s5", product_id: "p10", quantity: 1, price: 1300 },
  { id: "si9", sale_id: "s6", product_id: "p5", quantity: 1, price: 4500 },
  { id: "si10", sale_id: "s7", product_id: "p6", quantity: 1, price: 1600 },
  { id: "si11", sale_id: "s8", product_id: "p8", quantity: 1, price: 6000 },
];

const initialPayments: Payment[] = [
  { payment_id: "pay1", customer_id: "c1", amount: 2000, currency: "AFN", date: "2026-04-08", note: "پرداخت نقد" },
  { payment_id: "pay2", customer_id: "c3", amount: 5000, currency: "AFN", date: "2026-04-15", note: "پرداخت از طریق بانک" },
  { payment_id: "pay3", customer_id: "c5", amount: 3000, currency: "AFN", date: "2026-04-20", note: "پرداخت نقد" },
];

const initialCategories: Category[] = [
  { category_id: "cat1", name_fa: "برقی", name_en: "Electronics", description: "لوازم برقی و الکترونیکی" },
  { category_id: "cat2", name_fa: "آشپزخانه", name_en: "Kitchen", description: "لوازم آشپزخانه" },
  { category_id: "cat3", name_fa: "خانگی", name_en: "Home Appliances", description: "لوازم خانگی" },
];

const initialWithdrawals: Withdrawal[] = [];
const initialExpenses: Expense[] = [];
const initialShareholders: ShareHolder[] = [];
const initialSuppliers: Supplier[] = [];
const initialSupplierPurchases: SupplierPurchase[] = [];
const initialSupplierPayments: SupplierPayment[] = [];
const initialUsers: User[] = [
  { user_id: "u1", username: "admin", email: "admin@example.com", password: "admin123", full_name: "مدیر سیستم", role: "super_admin", is_active: true, permissions: ["*"] },
];
const initialActivityLogs: ActivityLog[] = [];

function loadFromStorage<T>(key: string, fallback: T, dbPrefix: string): T {
  try {
    const stored = localStorage.getItem(dbPrefix + key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const shopUserCtx = useShopUser();
  const dbPrefix = shopUserCtx.getDbPrefix();

  // Language & Currency
  const [language, setLanguage] = useState<Language>(() => loadFromStorage("language", "fa", dbPrefix));
  const [currency, setCurrency] = useState<Currency>(() => loadFromStorage("currency", "AFN", dbPrefix));

  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const loaded = loadFromStorage<User | null>("currentUser", null, dbPrefix);
    if (loaded && !loaded.permissions) {
      return { ...loaded, permissions: loaded.role === "super_admin" ? ["*"] : [] };
    }
    return loaded;
  });

  // Data
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = loadFromStorage<Product[]>("products", initialProducts, dbPrefix);
    return loaded.map(p => ({ ...p, min_stock: p.min_stock ?? 0 }));
  });
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage("categories", initialCategories, dbPrefix));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage("customers", initialCustomers, dbPrefix));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage("sales", initialSales, dbPrefix));
  const [saleItems, setSaleItems] = useState<SaleItem[]>(() => loadFromStorage("saleItems", initialSaleItems, dbPrefix));
  const [payments, setPayments] = useState<Payment[]>(() => loadFromStorage("payments", initialPayments, dbPrefix));
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() => loadFromStorage("withdrawals", initialWithdrawals, dbPrefix));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage("expenses", initialExpenses, dbPrefix));
  const [shareholders, setShareholders] = useState<ShareHolder[]>(() => loadFromStorage("shareholders", initialShareholders, dbPrefix));
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadFromStorage<User[]>("users", initialUsers, dbPrefix);
    return loaded.map(u => ({
      ...u,
      email: u.email || `${u.username}@example.com`,
      permissions: u.permissions ?? (u.role === "super_admin" ? ["*"] : []),
    }));
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage("activityLogs", initialActivityLogs, dbPrefix));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage("suppliers", initialSuppliers, dbPrefix));
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>(() => loadFromStorage("supplierPurchases", initialSupplierPurchases, dbPrefix));
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => loadFromStorage("supplierPayments", initialSupplierPayments, dbPrefix));
  const [cashAfn, setCashAfn] = useState<number>(() => loadFromStorage("cashAfn", 0, dbPrefix));
  const [cashUsd, setCashUsd] = useState<number>(() => loadFromStorage("cashUsd", 0, dbPrefix));

  useEffect(() => { localStorage.setItem(dbPrefix + "language", JSON.stringify(language)); }, [language, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "currency", JSON.stringify(currency)); }, [currency, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "currentUser", JSON.stringify(currentUser)); }, [currentUser, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "products", JSON.stringify(products)); }, [products, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "categories", JSON.stringify(categories)); }, [categories, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "customers", JSON.stringify(customers)); }, [customers, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "sales", JSON.stringify(sales)); }, [sales, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "saleItems", JSON.stringify(saleItems)); }, [saleItems, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "payments", JSON.stringify(payments)); }, [payments, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "withdrawals", JSON.stringify(withdrawals)); }, [withdrawals, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "expenses", JSON.stringify(expenses)); }, [expenses, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "shareholders", JSON.stringify(shareholders)); }, [shareholders, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "users", JSON.stringify(users)); }, [users, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "suppliers", JSON.stringify(suppliers)); }, [suppliers, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "supplierPurchases", JSON.stringify(supplierPurchases)); }, [supplierPurchases, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "supplierPayments", JSON.stringify(supplierPayments)); }, [supplierPayments, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "cashAfn", JSON.stringify(cashAfn)); }, [cashAfn, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "cashUsd", JSON.stringify(cashUsd)); }, [cashUsd, dbPrefix]);
  useEffect(() => { localStorage.setItem(dbPrefix + "activityLogs", JSON.stringify(activityLogs)); }, [activityLogs, dbPrefix]);

  const genId = (_prefix: string) => crypto.randomUUID();

  // Auth functions
  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password && u.is_active);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Activity log helper
  const logActivity = (
    action: "add" | "edit" | "delete",
    entity: string,
    entityName: string,
    description: string,
    entityId?: string,
    beforeData?: object,
    afterData?: object
  ) => {
    const logUser = currentUser || (shopUserCtx.currentShopUser ? {
      user_id: shopUserCtx.currentShopUser.shop_user_id,
      username: shopUserCtx.currentShopUser.email,
      full_name: shopUserCtx.currentShopUser.name,
    } : null);

    if (!logUser) return;

    const now = new Date();
    const log: ActivityLog = {
      log_id: genId("log"),
      user_id: logUser.user_id,
      username: logUser.username,
      full_name: logUser.full_name,
      action,
      entity,
      entity_name: entityName,
      entity_id: entityId,
      description,
      before_data: beforeData ? JSON.stringify(beforeData) : undefined,
      after_data: afterData ? JSON.stringify(afterData) : undefined,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0].slice(0, 5),
    };
    setActivityLogs(prev => [log, ...prev.slice(0, 999)]);
  };

  // Product functions
  const addProduct = (p: Omit<Product, "product_id">) => {
    const newId = genId("p");
    setProducts(prev => [...prev, { ...p, product_id: newId }]);
    logActivity("add", "product", p.name, `جنس "${p.name}" اضافه شد - قیمت فروش: ${p.sell_price_afn}؋، موجودی: ${p.stock}`, newId, undefined, p);
  };
  const updateProduct = (p: Product) => {
    const old = products.find(x => x.product_id === p.product_id);
    setProducts(prev => prev.map(x => x.product_id === p.product_id ? p : x));
    logActivity("edit", "product", p.name, `جنس "${p.name}" ویرایش شد`, p.product_id, old, p);
  };
  const deleteProduct = (id: string) => {
    const p = products.find(x => x.product_id === id);
    logActivity("delete", "product", p?.name || id, `جنس "${p?.name || id}" حذف شد`, id, p, undefined);
    setProducts(prev => prev.filter(x => x.product_id !== id));
  };
  const getProductById = (id: string) => products.find(p => p.product_id === id);

  // Category functions
  const addCategory = (c: Omit<Category, "category_id">) => {
    setCategories(prev => [...prev, { ...c, category_id: genId("cat") }]);
  };
  const updateCategory = (c: Category) => {
    setCategories(prev => prev.map(x => x.category_id === c.category_id ? c : x));
  };
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(x => x.category_id !== id));
  };

  // Customer functions
  const addCustomer = (c: Omit<Customer, "customer_id">) => {
    const newId = genId("c");
    setCustomers(prev => [...prev, { ...c, customer_id: newId }]);
    logActivity("add", "customer", c.name, `مشتری "${c.name}" اضافه شد`, newId, undefined, c);
  };
  const updateCustomer = (c: Customer) => {
    const old = customers.find(x => x.customer_id === c.customer_id);
    setCustomers(prev => prev.map(x => x.customer_id === c.customer_id ? c : x));
    logActivity("edit", "customer", c.name, `مشتری "${c.name}" ویرایش شد`, c.customer_id, old, c);
  };
  const deleteCustomer = (id: string) => {
    const c = customers.find(x => x.customer_id === id);
    logActivity("delete", "customer", c?.name || id, `مشتری "${c?.name || id}" حذف شد`, id, c, undefined);
    setCustomers(prev => prev.filter(x => x.customer_id !== id));
  };
  const getCustomerById = (id: string) => customers.find(c => c.customer_id === id);

  // Sale functions
  const addSale = (sale: Omit<Sale, "sale_id">, items: Omit<SaleItem, "id" | "sale_id">[]) => {
    const sale_id = genId("s");
    const newSale: Sale = { ...sale, sale_id };
    setSales(prev => [...prev, newSale]);
    const newItems = items.map(item => ({ ...item, id: genId("si"), sale_id }));
    setSaleItems(prev => [...prev, ...newItems]);
    // Update product stock
    setProducts(prev => prev.map(p => {
      const item = items.find(i => i.product_id === p.product_id);
      if (item) return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      return p;
    }));
    // Update customer balance
    setCustomers(prev => prev.map(c => {
      if (c.customer_id === sale.customer_id) {
        if (sale.currency === "AFN") {
          return { ...c, balance_afn: c.balance_afn + sale.remaining_amount };
        } else {
          return { ...c, balance_usd: c.balance_usd + sale.remaining_amount };
        }
      }
      return c;
    }));

    // Add paid amount to cash
    if (sale.paid_amount > 0) {
      if (sale.currency === "AFN") {
        setCashAfn(prev => prev + sale.paid_amount);
      } else {
        setCashUsd(prev => prev + sale.paid_amount);
      }
    }
    const cust = customers.find(c => c.customer_id === sale.customer_id);
    logActivity("add", "sale", cust?.name || sale.customer_id,
      `فروش به "${cust?.name}" - مبلغ: ${sale.total_amount} ${sale.currency}، پرداخت: ${sale.paid_amount}، باقی: ${sale.remaining_amount}`,
      sale_id, undefined, { ...sale, sale_id });
  };

  const deleteSale = (id: string) => {
    const sale = sales.find(s => s.sale_id === id);
    if (sale) {
      const items = saleItems.filter(i => i.sale_id === id);
      // Restore stock
      setProducts(prev => prev.map(p => {
        const item = items.find(i => i.product_id === p.product_id);
        if (item) return { ...p, stock: p.stock + item.quantity };
        return p;
      }));
      // Update customer balance
      setCustomers(prev => prev.map(c => {
        if (c.customer_id === sale.customer_id) {
          if (sale.currency === "AFN") {
            return { ...c, balance_afn: c.balance_afn - sale.remaining_amount };
          } else {
            return { ...c, balance_usd: c.balance_usd - sale.remaining_amount };
          }
        }
        return c;
      }));
    }
    logActivity("delete", "sale", id, `فروش ${id} حذف شد`);
    setSales(prev => prev.filter(s => s.sale_id !== id));
    setSaleItems(prev => prev.filter(i => i.sale_id !== id));
  };

  const getSaleItems = (saleId: string) => saleItems.filter(i => i.sale_id === saleId);
  const getCustomerSales = (customerId: string) => sales.filter(s => s.customer_id === customerId);

  // Payment functions
  const addPayment = (p: Omit<Payment, "payment_id">) => {
    setPayments(prev => [...prev, { ...p, payment_id: genId("pay") }]);
    const cust = customers.find(c => c.customer_id === p.customer_id);
    logActivity("add", "payment", cust?.name || p.customer_id, `پرداخت از "${cust?.name || p.customer_id}" ثبت شد`);

    // Reduce customer balance
    setCustomers(prev => prev.map(c => {
      if (c.customer_id === p.customer_id) {
        if (p.currency === "AFN") {
          return { ...c, balance_afn: Math.max(0, c.balance_afn - p.amount) };
        } else {
          return { ...c, balance_usd: Math.max(0, c.balance_usd - p.amount) };
        }
      }
      return c;
    }));

    // Add to cash
    if (p.currency === "AFN") {
      setCashAfn(prev => prev + p.amount);
    } else {
      setCashUsd(prev => prev + p.amount);
    }
  };

  const deletePayment = (id: string) => {
    const pay = payments.find(p => p.payment_id === id);
    if (pay) {
      setCustomers(prev => prev.map(c => {
        if (c.customer_id === pay.customer_id) {
          if (pay.currency === "AFN") {
            return { ...c, balance_afn: c.balance_afn + pay.amount };
          } else {
            return { ...c, balance_usd: c.balance_usd + pay.amount };
          }
        }
        return c;
      }));
    }
    setPayments(prev => prev.filter(p => p.payment_id !== id));
  };

  const getCustomerPayments = (customerId: string) => payments.filter(p => p.customer_id === customerId);

  // Withdrawal functions
  const addWithdrawal = (w: Omit<Withdrawal, "withdrawal_id">) => {
    const newId = genId("w");
    setWithdrawals(prev => [...prev, { ...w, withdrawal_id: newId }]);

    if (w.category === "customer" && w.customer_id) {
      // قرضه نقدی: به مشتری پول داده می‌شود → از پول نقد کم، به حساب طلب اضافه
      setCustomers(prev => prev.map(c => {
        if (c.customer_id === w.customer_id) {
          return {
            ...c,
            balance_afn: c.balance_afn + w.amount_afn,
            balance_usd: c.balance_usd + w.amount_usd,
          };
        }
        return c;
      }));
      if (w.amount_afn > 0) setCashAfn(prev => Math.max(0, prev - w.amount_afn));
      if (w.amount_usd > 0) setCashUsd(prev => Math.max(0, prev - w.amount_usd));
    } else if (w.category === "shareholder") {
      // برداشت سهامدار از پول نقد کم می‌شود
      if (w.amount_afn > 0) setCashAfn(prev => Math.max(0, prev - w.amount_afn));
      if (w.amount_usd > 0) setCashUsd(prev => Math.max(0, prev - w.amount_usd));
    }

    logActivity("add", "withdrawal", w.person_name,
      `برداشت "${w.category === "shareholder" ? "سهامدار" : "مشتری"}" توسط "${w.person_name}" - ${w.amount_afn > 0 ? w.amount_afn + "؋" : ""}${w.amount_usd > 0 ? "$" + w.amount_usd : ""}`,
      newId, undefined, w);
  };

  const deleteWithdrawal = (id: string) => {
    const withdrawal = withdrawals.find(w => w.withdrawal_id === id);

    if (withdrawal) {
      if (withdrawal.category === "customer" && withdrawal.customer_id) {
        // برگشت قرضه نقدی: از حساب مشتری کم، به پول نقد اضافه
        setCustomers(prev => prev.map(c => {
          if (c.customer_id === withdrawal.customer_id) {
            return {
              ...c,
              balance_afn: Math.max(0, c.balance_afn - withdrawal.amount_afn),
              balance_usd: Math.max(0, c.balance_usd - withdrawal.amount_usd),
            };
          }
          return c;
        }));
        if (withdrawal.amount_afn > 0) setCashAfn(prev => prev + withdrawal.amount_afn);
        if (withdrawal.amount_usd > 0) setCashUsd(prev => prev + withdrawal.amount_usd);
      } else if (withdrawal.category === "shareholder") {
        // برگشت برداشت سهامدار به پول نقد
        if (withdrawal.amount_afn > 0) setCashAfn(prev => prev + withdrawal.amount_afn);
        if (withdrawal.amount_usd > 0) setCashUsd(prev => prev + withdrawal.amount_usd);
      }
      logActivity("delete", "withdrawal", withdrawal.person_name, `برداشت "${withdrawal.person_name}" حذف شد`, id, withdrawal, undefined);
    }

    setWithdrawals(prev => prev.filter(w => w.withdrawal_id !== id));
  };

  // Expense functions
  const addExpense = (e: Omit<Expense, "expense_id">) => {
    const newId = genId("exp");
    setExpenses(prev => [...prev, { ...e, expense_id: newId }]);
    // مصرف از پول نقد کم می‌شود
    if (e.amount_afn > 0) setCashAfn(prev => Math.max(0, prev - e.amount_afn));
    if (e.amount_usd > 0) setCashUsd(prev => Math.max(0, prev - e.amount_usd));
    logActivity("add", "expense", e.category, `مصرف "${e.category}" - مبلغ: ${e.amount_afn > 0 ? e.amount_afn + "؋" : ""}${e.amount_usd > 0 ? "$" + e.amount_usd : ""} ثبت شد`, newId, undefined, e);
  };

  const updateExpense = (e: Expense) => {
    const old = expenses.find(x => x.expense_id === e.expense_id);
    // تنظیم پول نقد بر اساس تفاوت
    if (old) {
      const diffAfn = e.amount_afn - old.amount_afn;
      const diffUsd = e.amount_usd - old.amount_usd;
      if (diffAfn > 0) setCashAfn(prev => Math.max(0, prev - diffAfn));
      else if (diffAfn < 0) setCashAfn(prev => prev + Math.abs(diffAfn));
      if (diffUsd > 0) setCashUsd(prev => Math.max(0, prev - diffUsd));
      else if (diffUsd < 0) setCashUsd(prev => prev + Math.abs(diffUsd));
    }
    setExpenses(prev => prev.map(x => x.expense_id === e.expense_id ? e : x));
    logActivity("edit", "expense", e.category, `مصرف "${e.category}" ویرایش شد`, e.expense_id, old, e);
  };

  const deleteExpense = (id: string) => {
    const e = expenses.find(x => x.expense_id === id);
    // برگشت مصرف به پول نقد
    if (e) {
      if (e.amount_afn > 0) setCashAfn(prev => prev + e.amount_afn);
      if (e.amount_usd > 0) setCashUsd(prev => prev + e.amount_usd);
    }
    logActivity("delete", "expense", e?.category || id, `مصرف "${e?.category}" حذف شد`, id, e, undefined);
    setExpenses(prev => prev.filter(x => x.expense_id !== id));
  };

  // Shareholder functions
  const addShareHolder = (s: Omit<ShareHolder, "shareholder_id">) => {
    const newId = genId("sh");
    setShareholders(prev => [...prev, { ...s, shareholder_id: newId }]);
    // سرمایه اولیه سهامدار به پول نقد اضافه می‌شود
    if (s.investment_amount_afn > 0) setCashAfn(prev => prev + s.investment_amount_afn);
    if (s.investment_amount_usd > 0) setCashUsd(prev => prev + s.investment_amount_usd);
    logActivity("add", "shareholder", s.name, `سهام‌دار "${s.name}" اضافه شد - سرمایه: ${s.investment_amount_afn}؋`, newId, undefined, s);
  };

  const updateShareHolder = (s: ShareHolder) => {
    const old = shareholders.find(x => x.shareholder_id === s.shareholder_id);
    // تنظیم پول نقد بر اساس تغییر سرمایه
    if (old) {
      const diffAfn = s.investment_amount_afn - old.investment_amount_afn;
      const diffUsd = s.investment_amount_usd - old.investment_amount_usd;
      if (diffAfn !== 0) setCashAfn(prev => Math.max(0, prev + diffAfn));
      if (diffUsd !== 0) setCashUsd(prev => Math.max(0, prev + diffUsd));
    }
    setShareholders(prev => prev.map(x => x.shareholder_id === s.shareholder_id ? s : x));
    logActivity("edit", "shareholder", s.name, `سهام‌دار "${s.name}" ویرایش شد`, s.shareholder_id, old, s);
  };

  const deleteShareHolder = (id: string) => {
    const s = shareholders.find(x => x.shareholder_id === id);
    // کسر سرمایه سهامدار از پول نقد هنگام حذف
    if (s) {
      if (s.investment_amount_afn > 0) setCashAfn(prev => Math.max(0, prev - s.investment_amount_afn));
      if (s.investment_amount_usd > 0) setCashUsd(prev => Math.max(0, prev - s.investment_amount_usd));
    }
    logActivity("delete", "shareholder", s?.name || id, `سهام‌دار "${s?.name || id}" حذف شد`, id, s, undefined);
    setShareholders(prev => prev.filter(x => x.shareholder_id !== id));
  };

  // User functions
  const addUser = (u: Omit<User, "user_id">) => {
    const newId = genId("u");
    setUsers(prev => [...prev, { ...u, user_id: newId }]);
    logActivity("add", "user", u.username, `کاربر "${u.username}" با نقش "${u.role}" اضافه شد`, newId);
  };

  const updateUser = (u: User) => {
    const old = users.find(x => x.user_id === u.user_id);
    setUsers(prev => prev.map(x => x.user_id === u.user_id ? u : x));
    const safeOld = old ? { ...old, password: "***" } : undefined;
    const safeNew = { ...u, password: "***" };
    logActivity("edit", "user", u.username, `کاربر "${u.username}" ویرایش شد`, u.user_id, safeOld, safeNew);
  };

  const deleteUser = (id: string) => {
    const u = users.find(x => x.user_id === id);
    logActivity("delete", "user", u?.username || id, `کاربر "${u?.username || id}" حذف شد`, id, u ? { ...u, password: "***" } : undefined, undefined);
    setUsers(prev => prev.filter(x => x.user_id !== id));
  };

  // Supplier functions
  const addSupplier = (s: Omit<Supplier, "supplier_id">) => {
    const newId = genId("sup");
    setSuppliers(prev => [...prev, { ...s, supplier_id: newId }]);
    logActivity("add", "supplier", s.name, `سپلایر "${s.name}" اضافه شد`, newId);
  };

  const updateSupplier = (s: Supplier) => {
    const old = suppliers.find(x => x.supplier_id === s.supplier_id);
    setSuppliers(prev => prev.map(x => x.supplier_id === s.supplier_id ? s : x));
    logActivity("edit", "supplier", s.name, `سپلایر "${s.name}" ویرایش شد`, s.supplier_id, old, s);
  };

  const deleteSupplier = (id: string) => {
    const s = suppliers.find(x => x.supplier_id === id);
    logActivity("delete", "supplier", s?.name || id, `سپلایر "${s?.name || id}" حذف شد`, id, s, undefined);
    setSuppliers(prev => prev.filter(x => x.supplier_id !== id));
  };

  const getSupplierById = (id: string) => suppliers.find(s => s.supplier_id === id);

  // Supplier Purchase functions
  const addSupplierPurchase = (p: Omit<SupplierPurchase, "purchase_id">) => {
    const purchase_id = genId("spur");
    setSupplierPurchases(prev => [...prev, { ...p, purchase_id }]);

    // Update supplier balance (only the unpaid portion)
    setSuppliers(prev => prev.map(s => {
      if (s.supplier_id === p.supplier_id) {
        return {
          ...s,
          balance_afn: s.balance_afn + (p.total_amount_afn - p.paid_amount_afn),
          balance_usd: s.balance_usd + (p.total_amount_usd - p.paid_amount_usd),
        };
      }
      return s;
    }));

    // مبلغ پرداخت شده از پول نقد کم شود
    if (p.paid_amount_afn > 0) {
      setCashAfn(prev => Math.max(0, prev - p.paid_amount_afn));
    }
    if (p.paid_amount_usd > 0) {
      setCashUsd(prev => Math.max(0, prev - p.paid_amount_usd));
    }

    // Auto-record the paid portion as a payment entry (without double-adjusting balance)
    if (p.paid_amount_afn > 0 || p.paid_amount_usd > 0) {
      setSupplierPayments(prev => [...prev, {
        payment_id: genId("sppay"),
        supplier_id: p.supplier_id,
        amount_afn: p.paid_amount_afn,
        amount_usd: p.paid_amount_usd,
        date: p.date,
        note: p.description || "",
      }]);
    }
  };

  const deleteSupplierPurchase = (id: string) => {
    const purchase = supplierPurchases.find(p => p.purchase_id === id);
    if (purchase) {
      setSuppliers(prev => prev.map(s => {
        if (s.supplier_id === purchase.supplier_id) {
          return {
            ...s,
            balance_afn: Math.max(0, s.balance_afn - (purchase.total_amount_afn - purchase.paid_amount_afn)),
            balance_usd: Math.max(0, s.balance_usd - (purchase.total_amount_usd - purchase.paid_amount_usd)),
          };
        }
        return s;
      }));
    }
    setSupplierPurchases(prev => prev.filter(p => p.purchase_id !== id));
  };

  // Supplier Payment functions
  const addSupplierPayment = (p: Omit<SupplierPayment, "payment_id">) => {
    setSupplierPayments(prev => [...prev, { ...p, payment_id: genId("sppay") }]);

    // Reduce supplier balance
    setSuppliers(prev => prev.map(s => {
      if (s.supplier_id === p.supplier_id) {
        return {
          ...s,
          balance_afn: Math.max(0, s.balance_afn - p.amount_afn),
          balance_usd: Math.max(0, s.balance_usd - p.amount_usd),
        };
      }
      return s;
    }));
  };

  const deleteSupplierPayment = (id: string) => {
    const payment = supplierPayments.find(p => p.payment_id === id);
    if (payment) {
      setSuppliers(prev => prev.map(s => {
        if (s.supplier_id === payment.supplier_id) {
          return {
            ...s,
            balance_afn: s.balance_afn + payment.amount_afn,
            balance_usd: s.balance_usd + payment.amount_usd,
          };
        }
        return s;
      }));
    }
    setSupplierPayments(prev => prev.filter(p => p.payment_id !== id));
  };

  // Cash Management
  const updateCash = (amountAfn: number, amountUsd: number) => {
    setCashAfn(prev => prev + amountAfn);
    setCashUsd(prev => prev + amountUsd);
  };

  return (
    <AppContext.Provider value={{
      language, currency, setLanguage, setCurrency,
      currentUser, login, logout,
      products, addProduct, updateProduct, deleteProduct, getProductById,
      categories, addCategory, updateCategory, deleteCategory,
      customers, addCustomer, updateCustomer, deleteCustomer, getCustomerById,
      sales, saleItems, addSale, deleteSale, getSaleItems, getCustomerSales,
      payments, addPayment, deletePayment, getCustomerPayments,
      withdrawals, addWithdrawal, deleteWithdrawal,
      expenses, addExpense, updateExpense, deleteExpense,
      shareholders, addShareHolder, updateShareHolder, deleteShareHolder,
      users, addUser, updateUser, deleteUser,
      activityLogs, logActivity,
      suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierById,
      supplierPurchases, addSupplierPurchase, deleteSupplierPurchase,
      supplierPayments, addSupplierPayment, deleteSupplierPayment,
      cashAfn, cashUsd, updateCash,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function formatCurrency(amount: number | undefined | null, currency: Currency = "AFN"): string {
  const safeAmount = typeof amount === "number" && isFinite(amount) ? amount : 0;
  if (currency === "AFN") {
    return safeAmount.toLocaleString("fa-AF") + " ؋";
  } else {
    return "$" + safeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

// Translation helper
export const translations = {
  fa: {
    dashboard: "داشبورد",
    products: "اجناس",
    categories: "دسته‌بندی",
    customers: "مشتریان",
    sales: "فروش",
    payments: "پرداخت‌ها",
    expenses: "مصارف",
    withdrawals: "برداشت‌ها",
    shareholders: "سهام‌داران",
    users: "کاربران",
    login: "ورود",
    logout: "خروج",
    settings: "تنظیمات",
    language: "زبان",
    currency: "واحد پول",
    save: "ذخیره",
    cancel: "لغو",
    delete: "حذف",
    edit: "ویرایش",
    add: "افزودن",
    search: "جستجو",
    export: "خروجی",
    print: "چاپ",
    total: "مجموع",
    date: "تاریخ",
    name: "نام",
    phone: "شماره تماس",
    address: "آدرس",
    description: "توضیحات",
    price: "قیمت",
    quantity: "تعداد",
    stock: "موجودی",
    amount: "مبلغ",
    discount: "تخفیف",
    paid: "پرداخت شده",
    remaining: "باقیمانده",
    status: "وضعیت",
    customer: "مشتری",
    product: "جنس",
    category: "دسته",
  },
  en: {
    dashboard: "Dashboard",
    products: "Products",
    categories: "Categories",
    customers: "Customers",
    sales: "Sales",
    payments: "Payments",
    expenses: "Expenses",
    withdrawals: "Withdrawals",
    shareholders: "Shareholders",
    users: "Users",
    login: "Login",
    logout: "Logout",
    settings: "Settings",
    language: "Language",
    currency: "Currency",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    export: "Export",
    print: "Print",
    total: "Total",
    date: "Date",
    name: "Name",
    phone: "Phone",
    address: "Address",
    description: "Description",
    price: "Price",
    quantity: "Quantity",
    stock: "Stock",
    amount: "Amount",
    discount: "Discount",
    paid: "Paid",
    remaining: "Remaining",
    status: "Status",
    customer: "Customer",
    product: "Product",
    category: "Category",
  },
  ps: {
    dashboard: "ډشبورډ",
    products: "توکي",
    categories: "کټګورۍ",
    customers: "پیرودونکي",
    sales: "پلور",
    payments: "تادیات",
    expenses: "لګښتونه",
    withdrawals: "وباسنې",
    shareholders: "ونډه لرونکي",
    users: "کاروونکي",
    login: "ننوتل",
    logout: "وتل",
    settings: "تنظیمات",
    language: "ژبه",
    currency: "اسعار",
    save: "ساتل",
    cancel: "لغوه",
    delete: "حذف",
    edit: "تصحیح",
    add: "اضافه",
    search: "لټون",
    export: "صادر",
    print: "چاپ",
    total: "ټولټال",
    date: "تاریخ",
    name: "نوم",
    phone: "تلیفون",
    address: "پته",
    description: "تفصیل",
    price: "قیمت",
    quantity: "مقدار",
    stock: "موجودي",
    amount: "مبلغ",
    discount: "تخفیف",
    paid: "تادیه شوی",
    remaining: "پاتې",
    status: "حالت",
    customer: "پیرودونکی",
    product: "توکی",
    category: "کټګوري",
  },
};

export type TranslationKey = keyof typeof translations.fa;
