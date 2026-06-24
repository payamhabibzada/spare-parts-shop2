# Supabase Migration Guide

Complete guide for migrating from localStorage/mock data to Supabase.

## Overview

This migration transforms the Shop Management System from a client-side localStorage-based application to a fully production-ready system using Supabase as the backend.

### What Changed

**Before:**
- Data stored in `localStorage`
- Mock/demo data hardcoded in frontend
- Frontend-only authentication
- No real database
- No multi-tenancy

**After:**
- All data in PostgreSQL via Supabase
- Real authentication with Supabase Auth
- Row Level Security (RLS) for permissions
- Multi-tenant architecture
- Real-time capabilities ready
- Production-ready backend

---

## 1. Prerequisites

### Supabase Project Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization
   - Set project name: `shop-management`
   - Set database password (save securely!)
   - Choose region (closest to users)
   - Wait for project to initialize (~2 minutes)

2. **Get Project Credentials:**
   - Go to Project Settings > API
   - Copy `Project URL` (looks like: `https://xxxxx.supabase.co`)
   - Copy `anon public` key (starts with `eyJh...`)

---

## 2. Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

### Option B: Manual SQL Execution

1. Go to Supabase Dashboard > SQL Editor
2. Open `/supabase/migrations/20260606000001_initial_schema.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Wait for completion (~30 seconds)
7. Repeat for `20260606000002_rls_policies.sql`

**Verification:**
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see:
-- activity_logs, cash_ledger, categories, customers, 
-- expenses, payments, products, sale_items, sales, 
-- shareholders, shop_users, supplier_payments, 
-- supplier_purchases, suppliers, users, withdrawals
```

---

## 3. Configure Environment Variables

### Frontend Configuration

Create `.env.local` in project root:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application
VITE_APP_NAME=Shop Management System
VITE_APP_VERSION=2.0.0
NODE_ENV=development
```

**Replace:**
- `your-project.supabase.co` with your actual Project URL
- `your-anon-key-here` with your actual anon public key

### Backend Configuration (If using Express backend)

The backend is **OPTIONAL** now since Supabase handles everything. If you still want to use it for custom logic:

```env
# backend/.env
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

---

## 4. Code Changes Summary

### Removed Components

**localStorage usage** - Completely removed:
```typescript
// ❌ OLD (removed)
localStorage.setItem('products', JSON.stringify(products));
const products = JSON.parse(localStorage.getItem('products') || '[]');

// ✅ NEW (using Supabase)
const { data: products } = await supabase.from('products').select('*');
```

**Mock data providers** - Removed:
- `src/app/store/AppContext.tsx` (old localStorage context)
- `src/app/store/ShopUserContext.tsx` (old mock user context)
- All hardcoded demo users/passwords

**Old authentication** - Replaced:
```typescript
// ❌ OLD (removed)
const handleLogin = (username, password) => {
  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem('user', JSON.stringify({ username, role: 'admin' }));
  }
};

// ✅ NEW (Supabase Auth)
const { signIn } = useAuth();
await signIn({ email, password });
```

### New Components

**Supabase Client** - `src/app/lib/supabase.ts`:
- Centralized Supabase instance
- TypeScript database types
- Authentication configuration

**React Query Setup** - `src/app/lib/react-query.ts`:
- Query client configuration
- Caching strategy
- Optimistic updates ready

**Authentication Hook** - `src/app/hooks/useAuth.ts`:
- Supabase Auth integration
- Session management
- User data fetching
- Sign up/in/out mutations

**Data Hooks** - Custom hooks for each entity:
- `useProducts.ts` - Product CRUD operations
- `useCustomers.ts` - Customer management
- `useSales.ts` - Sales transactions
- Plus: Suppliers, Expenses, Shareholders, etc.

---

## 5. Updated Application Flow

### Registration Flow

```typescript
// Shop owner registration
import { useAuth } from '@/hooks/useAuth';

function RegisterPage() {
  const { signUp, isSigningUp } = useAuth();

  const handleSubmit = async (data) => {
    await signUp({
      email: data.email,
      password: data.password,
      name: data.name,
      shopName: data.shopName,
      phone: data.phone,
    });
    // User is automatically logged in
    // Shop record created in shop_users table
    // Cash ledger initialized
  };
}
```

### Login Flow

```typescript
function LoginPage() {
  const { signIn, isSigningIn } = useAuth();

  const handleSubmit = async (data) => {
    await signIn({
      email: data.email,
      password: data.password,
    });
    // Session created
    // User data fetched
    // Redirected to dashboard
  };
}
```

### Data Operations

```typescript
// Products
import { useProducts, useCreateProduct } from '@/hooks/useProducts';

function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();

  const handleCreate = async (product) => {
    await createProduct.mutateAsync(product);
    // Automatically refetches products list
    // Activity log created
    // RLS policies enforced
  };
}
```

### Protected Routes

```typescript
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
}
```

---

## 6. Security & Permissions

### Row Level Security (RLS)

All data access is secured at the database level:

```sql
-- Example: Users can only see their shop's products
CREATE POLICY "Users can view products"
  ON products FOR SELECT
  USING (shop_id = get_user_shop_id());
```

**No frontend code can bypass these policies!**

### Permission Checks

Permissions are enforced by RLS policies:

```typescript
// Frontend - declarative
const { data: products } = useProducts();
// If user doesn't have 'products:read' permission, query returns empty

// Database - enforces via RLS
CREATE POLICY "Users can view products"
  USING (has_permission('products:read'));
```

### Role Hierarchy

1. **SUPER_ADMIN** (Shop Owner)
   - Full access to everything in their shop
   - Can manage users
   - Can view financial data

2. **ADMIN**
   - Full access except user management
   - Can view all data
   - Can perform all operations

3. **USER**
   - Limited access based on permissions
   - Example permissions:
     - `products:read` - View products
     - `products:write` - Create/edit products
     - `sales:read` - View sales
     - `sales:write` - Create sales
     - `reports:read` - View reports

---

## 7. Migration Checklist

### Pre-Migration

- [ ] Supabase project created
- [ ] Database password saved securely
- [ ] Project URL and anon key copied
- [ ] Migrations run successfully
- [ ] RLS policies enabled
- [ ] Environment variables configured

### Code Updates

- [ ] Dependencies installed (`@supabase/supabase-js`, `@tanstack/react-query`)
- [ ] Supabase client configured
- [ ] Auth hook implemented
- [ ] Data hooks created
- [ ] App.tsx updated with QueryClientProvider
- [ ] Old contexts removed
- [ ] localStorage references removed
- [ ] Mock data removed

### Testing

- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Products CRUD works
- [ ] Customers CRUD works
- [ ] Sales creation works
- [ ] Permissions enforced
- [ ] Multi-tenancy works (different shops can't see each other's data)
- [ ] Activity logs recorded

### Production

- [ ] Environment variables in production
- [ ] Database backups configured
- [ ] RLS policies verified
- [ ] Performance tested
- [ ] Security audit completed

---

## 8. Common Issues & Solutions

### Issue: "Missing Supabase environment variables"

**Solution:**
```bash
# Create .env.local file
cp .env.example .env.local

# Edit and add your credentials
nano .env.local
```

### Issue: RLS policy blocking queries

**Solution:**
Check if user is authenticated:
```typescript
const { session } = useAuth();
console.log('Session:', session); // Should not be null
```

Verify user has shopId:
```typescript
const { shopId } = useAuth();
console.log('Shop ID:', shopId); // Should not be null
```

### Issue: "Row level security policy for table violated"

**Solution:**
This means the RLS policy is working! User doesn't have permission. Check:
1. Is user authenticated?
2. Does user have correct role?
3. Does user have required permission?

Debug in Supabase SQL Editor:
```sql
-- Check current user's shop
SELECT get_user_shop_id();

-- Check current user's role
SELECT get_user_role();

-- Check specific permission
SELECT has_permission('products:read');
```

### Issue: Products not showing after creation

**Solution:**
Query is cached. Invalidate manually:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['products'] });
```

Or use mutation which auto-invalidates:
```typescript
const createProduct = useCreateProduct();
await createProduct.mutateAsync(productData);
// Products automatically refetched
```

---

## 9. Performance Optimization

### React Query Caching

Data is cached for 5 minutes by default:

```typescript
// Configure in lib/react-query.ts
staleTime: 1000 * 60 * 5, // 5 minutes
```

### Optimistic Updates

Add optimistic updates for better UX:

```typescript
const updateProduct = useMutation({
  mutationFn: updateProductFn,
  onMutate: async (newProduct) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['products'] });

    // Snapshot previous value
    const previousProducts = queryClient.getQueryData(['products']);

    // Optimistically update
    queryClient.setQueryData(['products'], (old) => 
      old.map(p => p.id === newProduct.id ? newProduct : p)
    );

    return { previousProducts };
  },
  onError: (err, newProduct, context) => {
    // Rollback on error
    queryClient.setQueryData(['products'], context.previousProducts);
  },
});
```

### Real-time Updates (Optional)

Enable real-time subscriptions:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('products-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 10. Backup & Recovery

### Automated Backups

Supabase provides:
- Daily backups (Pro plan)
- Point-in-time recovery
- 7-day retention

### Manual Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or using pg_dump
pg_dump [connection-string] > backup.sql
```

### Restore

```bash
supabase db reset
supabase db push
psql [connection-string] < backup.sql
```

---

## 11. Monitoring

### Supabase Dashboard

Monitor:
- Database size: Project Settings > Database
- API usage: Project Settings > API > API Rate Limits
- Auth users: Authentication > Users
- Database queries: Database > Query Performance

### Application Monitoring

Add Sentry or similar:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

---

## 12. Next Steps

### Immediate

1. Test all features in development
2. Verify RLS policies work correctly
3. Ensure no localStorage references remain
4. Test multi-tenancy (create 2 shops, verify data isolation)

### Short Term

1. Add real-time subscriptions
2. Implement optimistic updates
3. Add comprehensive error handling
4. Set up monitoring

### Long Term

1. Configure production environment
2. Set up automated backups
3. Implement advanced permissions
4. Add analytics

---

## 13. Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: https://tanstack.com/query/latest
- **Supabase Discord**: https://discord.supabase.com
- **Project Issues**: GitHub repository issues

---

## Migration Complete! 🎉

Your application is now:
- ✅ Using real database (PostgreSQL)
- ✅ Secured with RLS policies
- ✅ Multi-tenant ready
- ✅ No localStorage dependencies
- ✅ No mock data
- ✅ Production-ready

All data now flows through Supabase with proper authentication, authorization, and data isolation.
