'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketType, TIMEFRAME_API_MAP } from '@qpulse/shared';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  PageHeader,
  Select,
  Spinner,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { useMemo, useState } from 'react';

const TIMEFRAMES = Object.keys(TIMEFRAME_API_MAP);

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const [marketType, setMarketType] = useState<string>(MarketType.FUTURES);
  const [timeframe, setTimeframe] = useState('3M');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', marketType, timeframe],
    queryFn: () => api.results.get(marketType.toLowerCase(), timeframe),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.signals.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['results'] });
      void queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.signals.batchDelete(ids),
    onSuccess: () => {
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ['results'] });
      void queryClient.invalidateQueries({ queryKey: ['signals'] });
    },
  });

  const pageIds = useMemo(() => data?.signals.map((s) => s.id) ?? [], [data]);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }

  function confirmDelete(id: string, pair: string) {
    if (confirm(`Delete closed signal ${pair}? It will be removed from results.`)) {
      deleteMutation.mutate(id);
    }
  }

  function confirmBatchDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (confirm(`Delete ${ids.length} selected signal(s)?`)) {
      batchDeleteMutation.mutate(ids);
    }
  }

  const summary = data?.summary;

  return (
    <div>
      <PageHeader
        title="Results"
        description="Closed signals and computed summary (same as mobile /results)"
        actions={
          selected.size > 0 ? (
            <Button
              variant="secondary"
              onClick={confirmBatchDelete}
              disabled={batchDeleteMutation.isPending}
            >
              Delete selected ({selected.size})
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={marketType}
          onChange={(e) => {
            setMarketType(e.target.value);
            setSelected(new Set());
          }}
          className="w-40"
        >
          {Object.values(MarketType).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Select
          value={timeframe}
          onChange={(e) => {
            setTimeframe(e.target.value);
            setSelected(new Set());
          }}
          className="w-32"
        >
          {TIMEFRAMES.map((tf) => (
            <option key={tf} value={tf}>
              {tf}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? <Spinner /> : null}
      {error ? <div className="text-red-400">Failed to load results</div> : null}

      {summary ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <div className="text-sm text-zinc-400">Total trades</div>
            <div className="text-2xl font-semibold">{summary.totalTrades}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-zinc-400">Win trades</div>
            <div className="text-2xl font-semibold">{summary.winTrades}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-zinc-400">Loss trades</div>
            <div className="text-2xl font-semibold">{summary.lossTrades}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-zinc-400">Win rate</div>
            <div className="text-2xl font-semibold">{summary.winRate}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-zinc-400">Total profit</div>
            <div className="text-2xl font-semibold">{summary.totalProfit}%</div>
          </Card>
        </div>
      ) : null}

      {data ? (
        <Table>
          <thead>
            <tr>
              <Th>
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Select all on page"
                />
              </Th>
              <Th>Pair</Th>
              <Th>Source</Th>
              <Th>Close date</Th>
              <Th>Profit %</Th>
              <Th>PnL USDT</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.signals.length === 0 ? (
              <tr>
                <Td className="text-center text-zinc-400">No closed signals in this timeframe</Td>
              </tr>
            ) : (
              data.signals.map((signal) => (
                <tr key={signal.id}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(signal.id)}
                      onChange={() => toggleOne(signal.id)}
                      aria-label={`Select ${signal.pair}`}
                    />
                  </Td>
                  <Td>{signal.pair}</Td>
                  <Td>{signal.source ?? '—'}</Td>
                  <Td>
                    {signal.closeDate ? new Date(signal.closeDate).toLocaleString() : '—'}
                  </Td>
                  <Td>{signal.profitPercentage ?? '—'}</Td>
                  <Td>{signal.realizedPnlUsdt ?? '—'}</Td>
                  <Td>
                    <button
                      type="button"
                      className="text-red-400 hover:underline"
                      onClick={() => confirmDelete(signal.id, signal.pair)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
