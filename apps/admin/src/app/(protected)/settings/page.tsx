'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { Alert, Button, Card, Input, Label, PageHeader, Spinner, Textarea } from '@/components/ui';
import { useEffect, useState } from 'react';

const settingsSchema = z.object({
  disclaimer: z.string().min(1),
  telegramFabUrl: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  const { register, handleSubmit, reset } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (!data) return;
    reset({
      disclaimer: data.disclaimer,
      telegramFabUrl: data.telegramFabUrl ?? '',
    });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: SettingsForm) =>
      api.settings.update({
        disclaimer: values.disclaimer,
        telegramFabUrl: values.telegramFabUrl || null,
      }),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      setSuccess(false);
      setError(err instanceof ApiError ? err.message : 'Save failed');
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Settings" description="App disclaimer and Telegram FAB URL" />

      <Card>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div>
            <Label>Disclaimer</Label>
            <Textarea rows={6} {...register('disclaimer')} />
          </div>
          <div>
            <Label>Telegram FAB URL</Label>
            <Input {...register('telegramFabUrl')} placeholder="https://t.me/..." />
          </div>

          {error ? <Alert>{error}</Alert> : null}
          {success ? <Alert variant="success">Saved successfully</Alert> : null}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
