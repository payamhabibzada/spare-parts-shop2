/**
 * Supabase Client Configuration
 * Centralized Supabase instance for the entire application
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database Types (Generated from Supabase)
export type Database = {
  public: {
    Tables: {
      shop_users: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string;
          shop_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shop_users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shop_users']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          shop_id: string;
          user_id: string | null;
          username: string;
          email: string;
          full_name: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          is_active: boolean;
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          category_id: string | null;
          barcode: string | null;
          buy_price_afn: number;
          buy_price_usd: number;
          sell_price_afn: number;
          sell_price_usd: number;
          stock: number;
          min_stock: number;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          phone: string;
          address: string;
          balance_afn: number;
          balance_usd: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          shop_id: string;
          customer_id: string;
          invoice_number: string | null;
          currency: 'AFN' | 'USD';
          total_amount: number;
          discount: number;
          paid_amount: number;
          remaining_amount: number;
          payment_status: 'PAID' | 'CREDIT' | 'PARTIAL';
          sale_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      sale_items: {
        Row: {
          id: string;
          shop_id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          price: number;
        };
        Insert: Omit<Database['public']['Tables']['sale_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          shop_id: string;
          customer_id: string;
          amount: number;
          currency: 'AFN' | 'USD';
          note: string;
          paid_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'paid_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      suppliers: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          company_name: string;
          phone: string;
          address: string;
          balance_afn: number;
          balance_usd: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      shareholders: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          phone: string;
          address: string;
          investment_amount_afn: number;
          investment_amount_usd: number;
          share_percentage: number;
          monthly_profit_afn: number;
          monthly_profit_usd: number;
          remaining_profit_afn: number;
          remaining_profit_usd: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shareholders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['shareholders']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          shop_id: string;
          category: string;
          description: string;
          amount_afn: number;
          amount_usd: number;
          expense_date: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'expense_date'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      withdrawals: {
        Row: {
          id: string;
          shop_id: string;
          category: 'SHAREHOLDER' | 'CUSTOMER';
          person_name: string;
          customer_id: string | null;
          amount_afn: number;
          amount_usd: number;
          description: string;
          withdrawn_at: string;
        };
        Insert: Omit<Database['public']['Tables']['withdrawals']['Row'], 'id' | 'withdrawn_at'>;
        Update: Partial<Database['public']['Tables']['withdrawals']['Insert']>;
      };
      cash_ledger: {
        Row: {
          id: string;
          shop_id: string;
          balance_afn: number;
          balance_usd: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cash_ledger']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cash_ledger']['Insert']>;
      };
      activity_logs: {
        Row: {
          id: string;
          shop_id: string;
          user_id: string;
          username: string;
          full_name: string;
          action: 'ADD' | 'EDIT' | 'DELETE';
          entity: string;
          entity_name: string;
          entity_id: string | null;
          description: string;
          before_data: any;
          after_data: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          shop_id: string;
          name_en: string;
          name_fa: string;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
    };
  };
};

// Helper types
export type ShopUser = Database['public']['Tables']['shop_users']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleItem = Database['public']['Tables']['sale_items']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Shareholder = Database['public']['Tables']['shareholders']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Withdrawal = Database['public']['Tables']['withdrawals']['Row'];
export type CashLedger = Database['public']['Tables']['cash_ledger']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
