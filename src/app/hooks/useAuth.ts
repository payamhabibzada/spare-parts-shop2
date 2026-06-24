/**
 * Authentication Hook
 * Manages Supabase authentication state
 */

import { useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, ShopUser, User as AppUser } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AuthState {
  supabaseUser: SupabaseUser | null;
  shopUser: ShopUser | null;
  appUser: AppUser | null;
  session: Session | null;
  isLoading: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    supabaseUser: null,
    shopUser: null,
    appUser: null,
    session: null,
    isLoading: true,
  });

  // Fetch current session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Fetch shop user data
  const { data: shopUser } = useQuery({
    queryKey: ['shopUser', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null;

      const { data, error } = await supabase
        .from('shop_users')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!session?.user.id,
  });

  // Fetch app user data (employee)
  const { data: appUser } = useQuery({
    queryKey: ['appUser', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!session?.user.id && !shopUser,
  });

  // Listen to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(prev => ({
        ...prev,
        supabaseUser: session?.user ?? null,
        session,
        isLoading: false,
      }));
      queryClient.invalidateQueries({ queryKey: ['session'] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Update auth state when data changes
  useEffect(() => {
    setAuthState({
      supabaseUser: session?.user ?? null,
      shopUser: shopUser ?? null,
      appUser: appUser ?? null,
      session,
      isLoading: !session && shopUser === undefined && appUser === undefined,
    });
  }, [session, shopUser, appUser]);

  // Sign up (shop owner registration)
  const signUpMutation = useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      name: string;
      shopName: string;
      phone: string;
    }) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create shop user
      const { error: shopError } = await supabase
        .from('shop_users')
        .insert({
          user_id: authData.user.id,
          email: params.email,
          name: params.name,
          shop_name: params.shopName,
          phone: params.phone,
        });

      if (shopError) throw shopError;

      // Create cash ledger
      const { data: shopData } = await supabase
        .from('shop_users')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (shopData) {
        await supabase
          .from('cash_ledger')
          .insert({
            shop_id: shopData.id,
            balance_afn: 0,
            balance_usd: 0,
          });
      }

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  // Sign in
  const signInMutation = useMutation({
    mutationFn: async (params: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  // Sign out
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user: authState.supabaseUser,
    shopUser: authState.shopUser,
    appUser: authState.appUser,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated: !!authState.session,
    isShopOwner: !!authState.shopUser,
    isEmployee: !!authState.appUser,
    role: authState.appUser?.role ?? (authState.shopUser ? 'SUPER_ADMIN' : 'USER'),
    permissions: authState.appUser?.permissions ?? [],
    shopId: authState.shopUser?.id ?? authState.appUser?.shop_id ?? null,
    signUp: signUpMutation.mutateAsync,
    signIn: signInMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
  };
}
