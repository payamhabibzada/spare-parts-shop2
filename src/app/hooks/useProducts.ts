/**
 * Products Data Hook
 * All product-related queries and mutations using Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Product } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useProducts(search?: string) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['products', shopId, search],
    queryFn: async () => {
      if (!shopId) return [];

      let query = supabase
        .from('products')
        .select('*, categories(*)') // Include category data
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

export function useProduct(id: string | undefined) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id || !shopId) return null;

      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id)
        .eq('shop_id', shopId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!shopId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async (
      product: Omit<Product, 'id' | 'shop_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!shopId) throw new Error('No shop selected');

      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, shop_id: shopId })
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
          entity: 'Product',
          entity_name: product.name,
          entity_id: data.id,
          description: `Added product: ${product.name}`,
          after_data: data,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Product>;
    }) => {
      if (!shopId) throw new Error('No shop selected');

      // Get current data for activity log
      const { data: beforeData } = await supabase
        .from('products')
        .select()
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('shop_id', shopId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      if (appUser && beforeData) {
        await supabase.from('activity_logs').insert({
          shop_id: shopId,
          user_id: appUser.id,
          username: appUser.username,
          full_name: appUser.full_name,
          action: 'EDIT',
          entity: 'Product',
          entity_name: data.name,
          entity_id: data.id,
          description: `Updated product: ${data.name}`,
          before_data: beforeData,
          after_data: data,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { shopId, appUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!shopId) throw new Error('No shop selected');

      // Get data for activity log
      const { data: product } = await supabase
        .from('products')
        .select()
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('shop_id', shopId);

      if (error) throw error;

      // Log activity
      if (appUser && product) {
        await supabase.from('activity_logs').insert({
          shop_id: shopId,
          user_id: appUser.id,
          username: appUser.username,
          full_name: appUser.full_name,
          action: 'DELETE',
          entity: 'Product',
          entity_name: product.name,
          entity_id: product.id,
          description: `Deleted product: ${product.name}`,
          before_data: product,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Low stock products
export function useLowStockProducts() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['products', 'low-stock', shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('stock', { ascending: true });

      if (error) throw error;
      return (data ?? []).filter((product) => product.stock <= product.min_stock);

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}

// Search by barcode
export function useProductByBarcode(barcode: string | undefined) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ['product', 'barcode', barcode],
    queryFn: async () => {
      if (!barcode || !shopId) return null;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .eq('barcode', barcode)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!barcode && !!shopId,
  });
}
