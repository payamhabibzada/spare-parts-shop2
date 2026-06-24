# Supabase Setup - Ready to Deploy!

## ✅ Credentials Configured

Your Supabase credentials have been configured in `.env.local`:

- **Project URL:** https://wuopqsbzaeaqzjzrmvhq.supabase.co
- **Anon Key:** Configured ✅

## 🚀 Next Steps

### 1. Run Database Migrations (REQUIRED - 2 minutes)

You need to create the database tables in your Supabase project.

**Option A: Using Supabase Dashboard (Easier)**

1. Go to https://supabase.com/dashboard
2. Open your project `wuopqsbzaeaqzjzrmvhq`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open file: `supabase/migrations/20260606000001_initial_schema.sql`
6. Copy the ENTIRE contents
7. Paste into SQL Editor
8. Click **Run** (bottom right)
9. Wait ~30 seconds for completion
10. Repeat steps 4-8 for `supabase/migrations/20260606000002_rls_policies.sql`

**Option B: Using Supabase CLI**

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref wuopqsbzaeaqzjzrmvhq

# Push migrations
supabase db push
```

### 2. Verify Database Setup (1 minute)

After running migrations, verify tables were created:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. You should see 16 tables:
   - shop_users
   - users
   - categories
   - products
   - customers
   - sales
   - sale_items
   - payments
   - suppliers
   - supplier_purchases
   - supplier_payments
   - shareholders
   - expenses
   - withdrawals
   - cash_ledger
   - activity_logs

If you see these tables, **migrations successful!** ✅

### 3. Test Supabase Connection (5 minutes)

**Test Authentication:**

Create a simple test file to verify connection:

```typescript
// test-supabase.ts
import { supabase } from './src/app/lib/supabase';

async function testConnection() {
  // Test 1: Check connection
  const { data, error } = await supabase.from('shop_users').select('count');
  
  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connection successful!');
  }

  // Test 2: Try to register
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'Test123!@#',
  });

  if (authError) {
    console.error('❌ Auth error:', authError.message);
  } else {
    console.log('✅ Auth working!', authData);
  }
}

testConnection();
```

### 4. Enable Email Auth in Supabase (1 minute)

1. Go to Supabase Dashboard
2. Click **Authentication** > **Providers**
3. Make sure **Email** is enabled
4. Configure:
   - ✅ Enable Email provider
   - ✅ Confirm email: OFF (for testing) or ON (for production)
   - ✅ Secure email change: ON (recommended)

### 5. Start Using Supabase!

**Your app is now in DUAL MODE:**

- **Currently Active:** localStorage (old system)
- **Ready to Use:** Supabase (new system)

**To switch to Supabase, migrate components one by one:**

See `SUPABASE_MIGRATION_GUIDE.md` for detailed instructions.

## 🧪 Quick Test

Want to quickly test if Supabase works? Try this:

1. **Open browser console** (F12)
2. **Run:**
   ```javascript
   // Test connection
   fetch('https://wuopqsbzaeaqzjzrmvhq.supabase.co/rest/v1/')
     .then(r => r.json())
     .then(d => console.log('✅ Supabase reachable:', d))
     .catch(e => console.error('❌ Error:', e));
   ```

If you see a response, Supabase is working!

## 📋 Checklist

- [x] Supabase credentials configured (.env.local)
- [ ] Database migrations run (16 tables created)
- [ ] Email auth enabled
- [ ] Test connection verified
- [ ] Ready to migrate components!

## 🐛 Troubleshooting

### "Invalid API key"

**Check:**
1. Is `.env.local` in the root directory?
2. Did you restart the dev server after creating `.env.local`?
   ```bash
   # Stop dev server (Ctrl+C)
   # Restart
   pnpm dev
   ```

### "Table does not exist"

**Fix:** Run the database migrations (see Step 1 above)

### "Row level security policy violated"

**This is normal!** It means RLS is working. You need to:
1. Be authenticated (logged in)
2. Have the correct permissions

## 🎯 What's Next?

### Option 1: Keep Using localStorage (Current)
- No changes needed
- App works perfectly as-is
- Supabase ready when you need it

### Option 2: Start Using Supabase (Recommended)
1. ✅ Run migrations (Step 1)
2. ✅ Test connection (Step 3)
3. 📝 Migrate first component (see guide)
4. 🧪 Test thoroughly
5. 🔄 Migrate other components gradually

## 📚 Documentation

- **Complete Guide:** `SUPABASE_MIGRATION_GUIDE.md`
- **Quick Reference:** `SUPABASE_QUICK_REFERENCE.txt`
- **Migration Status:** `MIGRATION_STATUS.md`

## ✨ Benefits Once Migrated

✅ Real database (not browser storage)  
✅ Multi-device access  
✅ Automatic backups  
✅ Enterprise security (RLS)  
✅ Multi-tenant isolation  
✅ Activity logging  
✅ Scalable architecture  

---

**Status:** Credentials configured ✅  
**Next:** Run database migrations  
**Time to production:** ~10 minutes  
