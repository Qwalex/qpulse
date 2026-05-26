'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Alert, PageHeader } from '@/components/ui';
import { SignalForm } from '@/components/signal-form';
import { useState } from 'react';

export default function NewSignalPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.signals.create(body),
    onSuccess: (signal) => {
      router.push(`/signals/${signal.id}/edit`);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Failed to create signal');
    },
  });

  return (
    <div>
      <PageHeader title="New signal" description="Create a new trading signal" />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <SignalForm
        onSubmit={(values) => {
          setError(null);
          mutation.mutate(values);
        }}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
