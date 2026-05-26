'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Alert, Button, PageHeader, Spinner } from '@/components/ui';
import { SignalForm } from '@/components/signal-form';
import { useState } from 'react';

export default function EditSignalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['signal', params.id],
    queryFn: () => api.signals.get(params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.signals.update(params.id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['signal', params.id] });
      void queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Failed to update signal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.signals.delete(params.id),
    onSuccess: () => {
      router.push('/signals');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Failed to delete signal');
    },
  });

  if (isLoading) return <Spinner />;
  if (!data) return <div className="text-red-400">Signal not found</div>;

  return (
    <div>
      <PageHeader
        title={`Edit ${data.pair}`}
        description={data.id}
        actions={
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Delete this signal?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        }
      />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <SignalForm
        initial={data}
        onSubmit={(values) => {
          setError(null);
          updateMutation.mutate(values);
        }}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
