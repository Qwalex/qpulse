'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketType, ResultsTimeframe } from '@qpulse/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError, type ResultsSummaryRow } from '@/lib/api';
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
  Spinner,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { useState } from 'react';

const summarySchema = z.object({
  marketType: z.nativeEnum(MarketType),
  timeframe: z.nativeEnum(ResultsTimeframe),
  totalTrades: z.coerce.number().int().min(0),
  winTrades: z.coerce.number().int().min(0),
  lossTrades: z.coerce.number().int().min(0),
  winRate: z.coerce.number().min(0),
  totalProfit: z.coerce.number(),
});

type SummaryForm = z.infer<typeof summarySchema>;

function SummaryFormPanel({
  initial,
  onDone,
}: {
  initial?: ResultsSummaryRow;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<SummaryForm>({
    resolver: zodResolver(summarySchema),
    defaultValues: initial
      ? {
          marketType: initial.marketType as MarketType,
          timeframe: initial.timeframe as ResultsTimeframe,
          totalTrades: initial.totalTrades,
          winTrades: initial.winTrades,
          lossTrades: initial.lossTrades,
          winRate: initial.winRate,
          totalProfit: initial.totalProfit,
        }
      : {
          marketType: MarketType.SPOT,
          timeframe: ResultsTimeframe.ONE_M,
          totalTrades: 0,
          winTrades: 0,
          lossTrades: 0,
          winRate: 0,
          totalProfit: 0,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: SummaryForm) =>
      initial
        ? api.resultsSummary.update(initial.marketType, initial.timeframe, values)
        : api.resultsSummary.upsert(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['results-summary'] });
      onDone();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    },
  });

  return (
    <Card className="mb-6">
      <form
        onSubmit={handleSubmit((values) => {
          setError(null);
          mutation.mutate(values);
        })}
        className="grid gap-4 md:grid-cols-3"
      >
        <div>
          <Label>Market</Label>
          <Select {...register('marketType')} disabled={!!initial}>
            {Object.values(MarketType).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Timeframe</Label>
          <Select {...register('timeframe')} disabled={!!initial}>
            {Object.values(ResultsTimeframe).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Total trades</Label>
          <Input type="number" {...register('totalTrades')} />
        </div>
        <div>
          <Label>Win trades</Label>
          <Input type="number" {...register('winTrades')} />
        </div>
        <div>
          <Label>Loss trades</Label>
          <Input type="number" {...register('lossTrades')} />
        </div>
        <div>
          <Label>Win rate</Label>
          <Input type="number" step="any" {...register('winRate')} />
        </div>
        <div>
          <Label>Total profit</Label>
          <Input type="number" step="any" {...register('totalProfit')} />
        </div>
        <div className="flex items-end gap-2 md:col-span-3">
          <Button type="submit" disabled={mutation.isPending}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        {error ? (
          <div className="md:col-span-3">
            <Alert>{error}</Alert>
          </div>
        ) : null}
      </form>
    </Card>
  );
}

export default function ResultsSummaryPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editing, setEditing] = useState<ResultsSummaryRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['results-summary'],
    queryFn: () => api.resultsSummary.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ marketType, timeframe }: ResultsSummaryRow) =>
      api.resultsSummary.delete(marketType, timeframe),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['results-summary'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Results summary"
        description="Manage aggregated results by market and timeframe"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setMode('create');
            }}
          >
            Add summary
          </Button>
        }
      />

      {mode !== 'list' ? (
        <SummaryFormPanel
          initial={mode === 'edit' ? editing ?? undefined : undefined}
          onDone={() => setMode('list')}
        />
      ) : null}

      {isLoading ? <Spinner /> : null}

      {data ? (
        <Table>
          <thead>
            <tr>
              <Th>Market</Th>
              <Th>Timeframe</Th>
              <Th>Trades</Th>
              <Th>Win rate</Th>
              <Th>Profit</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.marketType}-${row.timeframe}`}>
                <Td>{row.marketType}</Td>
                <Td>{row.timeframe}</Td>
                <Td>{row.totalTrades}</Td>
                <Td>{row.winRate}%</Td>
                <Td>{row.totalProfit}</Td>
                <Td className="space-x-2">
                  <button
                    type="button"
                    className="text-indigo-400 hover:underline"
                    onClick={() => {
                      setEditing(row);
                      setMode('edit');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:underline"
                    onClick={() => {
                      if (confirm('Delete this summary?')) {
                        deleteMutation.mutate(row);
                      }
                    }}
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
