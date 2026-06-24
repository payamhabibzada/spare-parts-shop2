-- Shop Management System - Initial Supabase Schema
-- Multi-tenant architecture with Row Level Security

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
CREATE TYPE currency_type AS ENUM ('AFN', 'USD');
CREATE TYPE payment_status AS ENUM ('PAID', 'CREDIT', 'PARTIAL');
CREATE TYPE withdrawal_category AS ENUM ('SHAREHOLDER', 'CUSTOMER');
CREATE TYPE audit_action AS ENUM ('ADD', 'EDIT', 'DELETE');

-- ============================================================================
-- SHOP USERS (Multi-tenancy root)
-- ============================================================================

CREATE TABLE shop_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  shop_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_users_user_id ON shop_users(user_id);
CREATE INDEX idx_shop_users_email ON shop_users(email);

-- ============================================================================
-- USERS (Shop employees)
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'USER',
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(shop_id, username),
  UNIQUE(shop_id, email)
);

CREATE INDEX idx_users_shop_id ON users(shop_id);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_shop_id ON categories(shop_id);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  barcode TEXT,
  buy_price_afn DECIMAL(14,2) DEFAULT 0,
  buy_price_usd DECIMAL(14,2) DEFAULT 0,
  sell_price_afn DECIMAL(14,2) DEFAULT 0,
  sell_price_usd DECIMAL(14,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_barcode ON products(shop_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_name ON products(shop_id, name);
CREATE INDEX idx_products_category ON products(category_id);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  balance_afn DECIMAL(14,2) DEFAULT 0,
  balance_usd DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_name ON customers(shop_id, name);

-- ============================================================================
-- SALES
-- ============================================================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number TEXT,
  currency currency_type DEFAULT 'AFN',
  total_amount DECIMAL(14,2) NOT NULL,
  discount DECIMAL(14,2) DEFAULT 0,
  paid_amount DECIMAL(14,2) DEFAULT 0,
  remaining_amount DECIMAL(14,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'CREDIT',
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_shop_id ON sales(shop_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(shop_id, sale_date DESC);

-- ============================================================================
-- SALE ITEMS
-- ============================================================================

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(14,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  currency currency_type DEFAULT 'AFN',
  note TEXT DEFAULT '',
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_shop_id ON payments(shop_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(shop_id, paid_at DESC);

-- ============================================================================
-- SUPPLIERS
-- ============================================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  balance_afn DECIMAL(14,2) DEFAULT 0,
  balance_usd DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_shop_id ON suppliers(shop_id);

-- ============================================================================
-- SUPPLIER PURCHASES
-- ============================================================================

CREATE TABLE supplier_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  total_amount_afn DECIMAL(14,2) DEFAULT 0,
  total_amount_usd DECIMAL(14,2) DEFAULT 0,
  paid_amount_afn DECIMAL(14,2) DEFAULT 0,
  paid_amount_usd DECIMAL(14,2) DEFAULT 0,
  items JSONB DEFAULT '[]',
  description TEXT DEFAULT '',
  purchase_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_purchases_shop_id ON supplier_purchases(shop_id);
CREATE INDEX idx_supplier_purchases_supplier_id ON supplier_purchases(supplier_id);

-- ============================================================================
-- SUPPLIER PAYMENTS
-- ============================================================================

CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  amount_afn DECIMAL(14,2) DEFAULT 0,
  amount_usd DECIMAL(14,2) DEFAULT 0,
  note TEXT DEFAULT '',
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_payments_shop_id ON supplier_payments(shop_id);
CREATE INDEX idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);

-- ============================================================================
-- SHAREHOLDERS
-- ============================================================================

CREATE TABLE shareholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  investment_amount_afn DECIMAL(14,2) DEFAULT 0,
  investment_amount_usd DECIMAL(14,2) DEFAULT 0,
  share_percentage DECIMAL(5,2) DEFAULT 0 CHECK (share_percentage >= 0 AND share_percentage <= 100),
  monthly_profit_afn DECIMAL(14,2) DEFAULT 0,
  monthly_profit_usd DECIMAL(14,2) DEFAULT 0,
  remaining_profit_afn DECIMAL(14,2) DEFAULT 0,
  remaining_profit_usd DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shareholders_shop_id ON shareholders(shop_id);

-- ============================================================================
-- EXPENSES
-- ============================================================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount_afn DECIMAL(14,2) DEFAULT 0,
  amount_usd DECIMAL(14,2) DEFAULT 0,
  expense_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_shop_id ON expenses(shop_id);
CREATE INDEX idx_expenses_date ON expenses(shop_id, expense_date DESC);

-- ============================================================================
-- WITHDRAWALS
-- ============================================================================

CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  category withdrawal_category NOT NULL,
  person_name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount_afn DECIMAL(14,2) DEFAULT 0,
  amount_usd DECIMAL(14,2) DEFAULT 0,
  description TEXT DEFAULT '',
  withdrawn_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_shop_id ON withdrawals(shop_id);
CREATE INDEX idx_withdrawals_date ON withdrawals(shop_id, withdrawn_at DESC);

-- ============================================================================
-- CASH LEDGER
-- ============================================================================

CREATE TABLE cash_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE UNIQUE,
  balance_afn DECIMAL(14,2) DEFAULT 0,
  balance_usd DECIMAL(14,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_ledger_shop_id ON cash_ledger(shop_id);

-- ============================================================================
-- ACTIVITY LOGS
-- ============================================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  action audit_action NOT NULL,
  entity TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_shop_id ON activity_logs(shop_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(shop_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(shop_id, entity);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shop_users_updated_at BEFORE UPDATE ON shop_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_ledger_updated_at BEFORE UPDATE ON cash_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
