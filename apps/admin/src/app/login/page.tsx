'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { Alert, Button, Card, Input, Label } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    }
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-zinc-50">QPulse Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">Sign in to manage signals and content</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" autoComplete="email" {...register('email')} />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <Label>Password</Label>
            <Input type="password" autoComplete="current-password" {...register('password')} />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            ) : null}
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
