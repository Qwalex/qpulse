'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminUserDto } from '@qpulse/shared';
import { api, setAccessToken } from '@/lib/api';

interface AuthContextValue {
  user: AdminUserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const result = await api.refresh();
      setAccessToken(result.accessToken);
      return result.user;
    },
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      queryClient.setQueryData(['auth-session'], result.user);
      router.push('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logout(),
    onSettled: () => {
      setAccessToken(null);
      queryClient.setQueryData(['auth-session'], null);
      router.push('/login');
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      setAccessToken(null);
      queryClient.setQueryData(['auth-session'], null);
      router.push('/login');
    }
  }, [logoutMutation, queryClient, router]);

  const user = sessionQuery.isError ? null : (sessionQuery.data ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: sessionQuery.isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, sessionQuery.isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
