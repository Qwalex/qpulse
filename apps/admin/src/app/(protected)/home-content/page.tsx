'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { Alert, Button, Card, Input, Label, PageHeader, Spinner, Textarea } from '@/components/ui';
import { useEffect, useState } from 'react';

const homeSchema = z.object({
  totalMarketCap: z.string(),
  totalMarketCapChange24h: z.coerce.number(),
  altcoinSeasonIndex: z.coerce.number().int().min(0).max(100),
  altcoinSeasonLabel: z.string(),
  fearGreedValue: z.coerce.number().int().min(0).max(100),
  fearGreedLabel: z.string(),
  socialLinksJson: z.string(),
});

type HomeForm = z.infer<typeof homeSchema>;

export default function HomeContentPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['home-content'],
    queryFn: () => api.homeContent.get(),
  });

  const { register, handleSubmit, reset } = useForm<HomeForm>({
    resolver: zodResolver(homeSchema),
  });

  useEffect(() => {
    if (!data) return;
    reset({
      totalMarketCap: data.totalMarketCap,
      totalMarketCapChange24h: data.totalMarketCapChange24h,
      altcoinSeasonIndex: data.altcoinSeasonIndex,
      altcoinSeasonLabel: data.altcoinSeasonLabel,
      fearGreedValue: data.fearGreedValue,
      fearGreedLabel: data.fearGreedLabel,
      socialLinksJson: JSON.stringify(data.socialLinks, null, 2),
    });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: HomeForm) => {
      let socialLinks: unknown;
      try {
        socialLinks = JSON.parse(values.socialLinksJson);
      } catch {
        throw new Error('Invalid JSON in social links');
      }
      return api.homeContent.update({
        totalMarketCap: values.totalMarketCap,
        totalMarketCapChange24h: values.totalMarketCapChange24h,
        altcoinSeasonIndex: values.altcoinSeasonIndex,
        altcoinSeasonLabel: values.altcoinSeasonLabel,
        fearGreedValue: values.fearGreedValue,
        fearGreedLabel: values.fearGreedLabel,
        socialLinks,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['home-content'] });
    },
    onError: (err) => {
      setSuccess(false);
      setError(err instanceof ApiError ? err.message : 'Save failed');
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Home content"
        description="Market metrics, fear & greed index, and social links for the mobile dashboard"
      />

      <Card>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 md:grid-cols-2"
        >
          <div>
            <Label>Total market cap</Label>
            <Input {...register('totalMarketCap')} placeholder="$2.84T" />
          </div>
          <div>
            <Label>Market cap change 24h (%)</Label>
            <Input type="number" step="any" {...register('totalMarketCapChange24h')} />
          </div>
          <div>
            <Label>Altcoin Season index (0–100)</Label>
            <Input type="number" {...register('altcoinSeasonIndex')} />
          </div>
          <div>
            <Label>Altcoin Season label</Label>
            <Input {...register('altcoinSeasonLabel')} placeholder="Bitcoin Season" />
          </div>
          <div>
            <Label>Fear & Greed value (0–100)</Label>
            <Input type="number" {...register('fearGreedValue')} />
          </div>
          <div>
            <Label>Fear & Greed label</Label>
            <Input {...register('fearGreedLabel')} placeholder="Greed" />
          </div>
          <div className="md:col-span-2">
            <Label>Social links (JSON array)</Label>
            <Textarea rows={6} className="font-mono text-xs" {...register('socialLinksJson')} />
          </div>

          {error ? (
            <div className="md:col-span-2">
              <Alert>{error}</Alert>
            </div>
          ) : null}
          {success ? (
            <div className="md:col-span-2">
              <Alert variant="success">Saved successfully</Alert>
            </div>
          ) : null}

          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
