-- Row Level Security (RLS) Policies
-- Enforce multi-tenancy and role-based access control at the database level

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current shop_id for the authenticated user
CREATE OR REPLACE FUNCTION get_user_shop_id()
RETURNS UUID AS $$
DECLARE
  shop_id UUID;
BEGIN
  -- First check if user is a shop owner
  SELECT id INTO shop_id
  FROM shop_users
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- If not, check if user is a shop employee
  IF shop_id IS NULL THEN
    SELECT u.shop_id INTO shop_id
    FROM users u
    WHERE u.user_id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Check if user is shop owner (implied SUPER_ADMIN)
  SELECT 'SUPER_ADMIN'::user_role INTO user_role_value
  FROM shop_users
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- If not shop owner, get role from users table
  IF user_role_value IS NULL THEN
    SELECT role INTO user_role_value
    FROM users
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;

  RETURN COALESCE(user_role_value, 'USER'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value user_role;
  user_permissions TEXT[];
BEGIN
  user_role_value := get_user_role();

  -- SUPER_ADMIN and ADMIN have all permissions
  IF user_role_value IN ('SUPER_ADMIN', 'ADMIN') THEN
    RETURN true;
  END IF;

  -- Check specific permission for USER role
  SELECT permissions INTO user_permissions
  FROM users
  WHERE user_id = auth.uid();

  RETURN permission_name = ANY(user_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SHOP USERS POLICIES
-- ============================================================================

-- Shop owners can view and update their own shop
CREATE POLICY "Shop owners can view own shop"
  ON shop_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Shop owners can update own shop"
  ON shop_users FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anyone can create a shop (registration)
CREATE POLICY "Anyone can create shop"
  ON shop_users FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- USERS POLICIES (Shop employees)
-- ============================================================================

-- Users in same shop can view each other
CREATE POLICY "Users can view shop users"
  ON users FOR SELECT
  USING (shop_id = get_user_shop_id());

-- Only ADMIN and SUPER_ADMIN can manage users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (shop_id = get_user_shop_id());

CREATE POLICY "Users with permission can manage categories"
  ON categories FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('products:write')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('products:write')
  );

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view products"
  ON products FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('products:read')
  );

CREATE POLICY "Users can manage products"
  ON products FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('products:write')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('products:write')
  );

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view customers"
  ON customers FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('customers:read')
  );

CREATE POLICY "Users can manage customers"
  ON customers FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('customers:write')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('customers:write')
  );

-- ============================================================================
-- SALES POLICIES
-- ============================================================================

CREATE POLICY "Users can view sales"
  ON sales FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('sales:read')
  );

CREATE POLICY "Users can create sales"
  ON sales FOR INSERT
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('sales:write')
  );

CREATE POLICY "Users can update sales"
  ON sales FOR UPDATE
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('sales:write')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('sales:write')
  );

-- ============================================================================
-- SALE ITEMS POLICIES
-- ============================================================================

CREATE POLICY "Users can view sale items"
  ON sale_items FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('sales:read')
  );

CREATE POLICY "Users can manage sale items"
  ON sale_items FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('sales:write')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('sales:write')
  );

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view payments"
  ON payments FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('customers:read')
  );

CREATE POLICY "Users can manage payments"
  ON payments FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('customers:write')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    has_permission('customers:write')
  );

-- ============================================================================
-- SUPPLIERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view suppliers"
  ON suppliers FOR SELECT
  USING (shop_id = get_user_shop_id());

CREATE POLICY "Users can manage suppliers"
  ON suppliers FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- SUPPLIER PURCHASES POLICIES
-- ============================================================================

CREATE POLICY "Users can view supplier purchases"
  ON supplier_purchases FOR SELECT
  USING (shop_id = get_user_shop_id());

CREATE POLICY "Users can manage supplier purchases"
  ON supplier_purchases FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- SUPPLIER PAYMENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view supplier payments"
  ON supplier_payments FOR SELECT
  USING (shop_id = get_user_shop_id());

CREATE POLICY "Users can manage supplier payments"
  ON supplier_payments FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- SHAREHOLDERS POLICIES
-- ============================================================================

CREATE POLICY "Admins can view shareholders"
  ON shareholders FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Admins can manage shareholders"
  ON shareholders FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- EXPENSES POLICIES
-- ============================================================================

CREATE POLICY "Admins can view expenses"
  ON expenses FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Admins can manage expenses"
  ON expenses FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- WITHDRAWALS POLICIES
-- ============================================================================

CREATE POLICY "Admins can view withdrawals"
  ON withdrawals FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Admins can manage withdrawals"
  ON withdrawals FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- CASH LEDGER POLICIES
-- ============================================================================

CREATE POLICY "Admins can view cash ledger"
  ON cash_ledger FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

CREATE POLICY "Admins can manage cash ledger"
  ON cash_ledger FOR ALL
  USING (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  )
  WITH CHECK (
    shop_id = get_user_shop_id() AND
    get_user_role() IN ('SUPER_ADMIN', 'ADMIN')
  );

-- ============================================================================
-- ACTIVITY LOGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    shop_id = get_user_shop_id() AND
    has_permission('reports:read')
  );

CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (shop_id = get_user_shop_id());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to execute helper functions
GRANT EXECUTE ON FUNCTION get_user_shop_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission(TEXT) TO authenticated;
