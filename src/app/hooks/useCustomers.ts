/**
 * Customers Data Hook
 * All customer-related queries and mutations using Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Customer } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useCustomers(search?: string) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['customers', shopId, search],
    queryFn: async () => {
      if (!shopId) return [];

      let query = supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .order('name');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}

export function useCustomer(id: string | undefined) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id || !shopId) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('shop_id', shopId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!shopId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async (
      customer: Omit<Customer, 'id' | 'shop_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!shopId) throw new Error('No shop selected');

      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, shop_id: shopId })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      if (appUser) {
        await supabase.from('activity_logs').insert({
          shop_id: shopId,
          user_id: appUser.id,
          username: appUser.username,
          full_name: appUser.full_name,
          action: 'ADD',
          entity: 'Customer',
          entity_name: customer.name,
          entity_id: data.id,
          description: `Added customer: ${customer.name}`,
          after_data: data,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Customer>;
    }) => {
      if (!shopId) throw new Error('No shop selected');

      const { data: beforeData } = await supabase
        .from('customers')
        .select()
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('shop_id', shopId)
        .select()
        .single();

      if (error) throw error;

      if (appUser && beforeData) {
        await supabase.from('activity_logs').insert({
          shop_id: shopId,
          user_id: appUser.id,
          username: appUser.username,
          full_name: appUser.full_name,
          action: 'EDIT',
          entity: 'Customer',
          entity_name: data.name,
          entity_id: data.id,
          description: `Updated customer: ${data.name}`,
          before_data: beforeData,
          after_data: data,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!shopId) throw new Error('No shop selected');

      const { data: customer } = await supabase
        .from('customers')
        .select()
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('shop_id', shopId);

      if (error) throw error;

      if (appUser && customer) {
        await supabase.from('activity_logs').insert({
          shop_id: shopId,
          user_id: appUser.id,
          username: appUser.username,
          full_name: appUser.full_name,
          action: 'DELETE',
          entity: 'Customer',
          entity_name: customer.name,
          entity_id: customer.id,
          description: `Deleted customer: ${customer.name}`,
          before_data: customer,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Customer with debts
export function useCustomersWithDebt() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['customers', 'debts', shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .or('balance_afn.gt.0,balance_usd.gt.0')
        .order('balance_afn', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}
