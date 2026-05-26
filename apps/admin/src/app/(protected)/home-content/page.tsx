'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { Alert, Button, Card, Input, Label, PageHeader, Spinner, Textarea } from '@/components/ui';
import { useEffect, useState } from 'react';

const homeSchema = z.object({
  btcPrice: z.coerce.number(),
  btcChange24h: z.coerce.number(),
  btcMarketCap: z.string(),
  btcVolume: z.string(),
  fearGreedValue: z.coerce.number().int(),
  fearGreedLabel: z.string(),
  tickerJson: z.string(),
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
      btcPrice: data.btcPrice,
      btcChange24h: data.btcChange24h,
      btcMarketCap: data.btcMarketCap,
      btcVolume: data.btcVolume,
      fearGreedValue: data.fearGreedValue,
      fearGreedLabel: data.fearGreedLabel,
      tickerJson: JSON.stringify(data.ticker, null, 2),
      socialLinksJson: JSON.stringify(data.socialLinks, null, 2),
    });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: HomeForm) => {
      let ticker: unknown;
      let socialLinks: unknown;
      try {
        ticker = JSON.parse(values.tickerJson);
        socialLinks = JSON.parse(values.socialLinksJson);
      } catch {
        throw new Error('Invalid JSON in ticker or social links');
      }
      return api.homeContent.update({
        btcPrice: values.btcPrice,
        btcChange24h: values.btcChange24h,
        btcMarketCap: values.btcMarketCap,
        btcVolume: values.btcVolume,
        fearGreedValue: values.fearGreedValue,
        fearGreedLabel: values.fearGreedLabel,
        ticker,
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
      <PageHeader title="Home content" description="BTC stats, ticker and social links" />

      <Card>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="grid gap-4 md:grid-cols-2"
        >
          <div>
            <Label>BTC price</Label>
            <Input type="number" step="any" {...register('btcPrice')} />
          </div>
          <div>
            <Label>BTC change 24h</Label>
            <Input type="number" step="any" {...register('btcChange24h')} />
          </div>
          <div>
            <Label>Market cap</Label>
            <Input {...register('btcMarketCap')} />
          </div>
          <div>
            <Label>Volume</Label>
            <Input {...register('btcVolume')} />
          </div>
          <div>
            <Label>Fear & Greed value</Label>
            <Input type="number" {...register('fearGreedValue')} />
          </div>
          <div>
            <Label>Fear & Greed label</Label>
            <Input {...register('fearGreedLabel')} />
          </div>
          <div className="md:col-span-2">
            <Label>Ticker (JSON array)</Label>
            <Textarea rows={6} className="font-mono text-xs" {...register('tickerJson')} />
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
