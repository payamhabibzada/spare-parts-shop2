/**
 * Sales Data Hook
 * All sales-related queries and mutations using Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSales() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['sales', shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(*), sale_items(*, products(*))')
        .eq('shop_id', shopId)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}

export function useSale(id: string | undefined) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      if (!id || !shopId) return null;

      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(*), sale_items(*, products(*))')
        .eq('id', id)
        .eq('shop_id', shopId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!shopId,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      customer_id: string;
      invoice_number: string | null;
      currency: 'AFN' | 'USD';
      items: Array<{
        product_id: string;
        quantity: number;
        price: number;
      }>;
      discount: number;
      paid_amount: number;
    }) => {
      if (!shopId) throw new Error('No shop selected');

      // Calculate totals
      const total_amount = params.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const remaining_amount = total_amount - params.discount - params.paid_amount;
      const payment_status =
        remaining_amount <= 0 ? 'PAID' : params.paid_amount > 0 ? 'PARTIAL' : 'CREDIT';

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          shop_id: shopId,
          customer_id: params.customer_id,
          invoice_number: params.invoice_number,
          currency: params.currency,
          total_amount,
          discount: params.discount,
          paid_amount: params.paid_amount,
          remaining_amount,
          payment_status,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = params.items.map(item => ({
        shop_id: shopId,
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of params.items) {
        const { error: stockError } = await supabase.rpc('update_product_stock', {
          p_product_id: item.product_id,
          p_quantity_change: -item.quantity,
        });

        if (stockError) {
          // Fallback: manual update
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock - item.quantity })
              .eq('id', item.product_id);
          }
        }
      }

      // Update customer balance if credit
      if (remaining_amount > 0) {
        const { data: customer } = await supabase
          .from('customers')
          .select('balance_afn, balance_usd')
          .eq('id', params.customer_id)
          .single();

        if (customer) {
          const updates =
            params.currency === 'AFN'
              ? { balance_afn: customer.balance_afn + remaining_amount }
              : { balance_usd: customer.balance_usd + remaining_amount };

          await supabase
            .from('customers')
            .update(updates)
            .eq('id', params.customer_id);
        }
      }

      // Update cash ledger
      if (params.paid_amount > 0) {
        const { data: ledger } = await supabase
          .from('cash_ledger')
          .select()
          .eq('shop_id', shopId)
          .single();

        if (ledger) {
          const updates =
            params.currency === 'AFN'
              ? { balance_afn: ledger.balance_afn + params.paid_amount }
              : { balance_usd: ledger.balance_usd + params.paid_amount };

          await supabase
            .from('cash_ledger')
            .update(updates)
            .eq('shop_id', shopId);
        }
      }

      // Log activity
      if (appUser) {
        await supabase.from('activity_logs').insert({
          shop_id: shopId,
          user_id: appUser.id,
          username: appUser.username,
          full_name: appUser.full_name,
          action: 'ADD',
          entity: 'Sale',
          entity_name: `Invoice ${params.invoice_number || sale.id}`,
          entity_id: sale.id,
          description: `Created sale for ${total_amount} ${params.currency}`,
          after_data: sale,
        });
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['cash_ledger'] });
    },
  });
}
