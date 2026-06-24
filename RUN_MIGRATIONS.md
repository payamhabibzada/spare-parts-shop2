# How to Run Database Migrations

Your Supabase credentials are configured! Now you need to create the database tables.

## 📋 What Migrations Do

The migrations will create:
- **16 database tables** (products, customers, sales, etc.)
- **50+ security policies** (Row Level Security)
- **Helper functions** for permissions
- **Indexes** for performance
- **Triggers** for automatic timestamps

## 🚀 Option 1: Supabase Dashboard (Recommended - Easy!)

### Step-by-Step:

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/wuopqsbzaeaqzjzrmvhq
   ```

2. **Go to SQL Editor:**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

3. **Run First Migration (Schema):**
   - Open this file in VS Code: `supabase/migrations/20260606000001_initial_schema.sql`
   - Select ALL (Ctrl+A or Cmd+A)
   - Copy (Ctrl+C or Cmd+C)
   - Paste into Supabase SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - Wait ~30 seconds
   - You should see: "Success. No rows returned"

4. **Run Second Migration (Security):**
   - Click **New Query** again
   - Open file: `supabase/migrations/20260606000002_rls_policies.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **Run**
   - Wait ~20 seconds
   - You should see: "Success. No rows returned"

5. **Verify Success:**
   - Click **Table Editor** in sidebar
   - You should see 16 tables listed!

**If you see the tables, you're done! ✅**

## 🚀 Option 2: Supabase CLI (Advanced)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref wuopqsbzaeaqzjzrmvhq

# Push migrations
supabase db push

# Done! ✅
```

## 🚀 Option 3: Manual SQL (If other options fail)

If the migration files are too large, run smaller chunks:

### Create Tables First:

```sql
-- In Supabase SQL Editor, run this first:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Then copy and run each CREATE TABLE statement one by one
-- from 20260606000001_initial_schema.sql
```

## ✅ Verify Migrations Worked

After running migrations, check:

1. **Tables Created:**
   - Go to **Table Editor**
   - You should see 16 tables

2. **Test Query:**
   ```sql
   -- Run in SQL Editor
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   
   Should return:
   ```
   activity_logs
   cash_ledger
   categories
   customers
   expenses
   payments
   products
   sale_items
   sales
   shareholders
   shop_users
   supplier_payments
   supplier_purchases
   suppliers
   users
   withdrawals
   ```

3. **RLS Enabled:**
   ```sql
   -- Run in SQL Editor
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
   
   All tables should have `rowsecurity = true`

## 🐛 Common Issues

### "Permission denied"
- Make sure you're the project owner
- Check you're logged into the correct Supabase account

### "Relation already exists"
- Tables already created! You're good to go ✅
- Or drop existing tables first (careful!)

### "Syntax error"
- Make sure you copied the ENTIRE file
- Check for any extra characters at the beginning/end

### Migration file too large
- Copy and paste in smaller chunks
- Or use Supabase CLI (Option 2)

## 📞 Need Help?

If migrations fail:
1. Check the error message
2. Copy the exact error
3. Search for it in Supabase docs
4. Or try CLI method (more reliable for large files)

## 🎯 After Migrations Complete

1. ✅ Verify 16 tables exist
2. ✅ Test connection (see SUPABASE_SETUP_COMPLETE.md)
3. 🎨 Start migrating components (see SUPABASE_MIGRATION_GUIDE.md)

---

**Your Project:** wuopqsbzaeaqzjzrmvhq  
**Dashboard:** https://supabase.com/dashboard/project/wuopqsbzaeaqzjzrmvhq  
**SQL Editor:** Click "SQL Editor" in sidebar  

**Time Required:** 2-5 minutes  
**Difficulty:** Easy (copy & paste)  
