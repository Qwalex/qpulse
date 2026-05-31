'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketType, SignalStatus } from '@qpulse/shared';
import { api } from '@/lib/api';
import { Button, PageHeader, Select, Spinner, Table, Td, Th } from '@/components/ui';
import { useMemo, useState } from 'react';

export default function SignalsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [marketType, setMarketType] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['signals', status, marketType],
    queryFn: () =>
      api.signals.list({
        status: status || undefined,
        marketType: marketType || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.signals.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['signals'] });
      void queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.signals.batchDelete(ids),
    onSuccess: () => {
      setSelected(new Set());
      void queryClient.invalidateQueries({ queryKey: ['signals'] });
      void queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });

  const pageIds = useMemo(() => data?.map((s) => s.id) ?? [], [data]);
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
    if (confirm(`Delete signal ${pair}?`)) {
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

  return (
    <div>
      <PageHeader
        title="Signals"
        description="Manage trading signals"
        actions={
          <div className="flex gap-2">
            {selected.size > 0 ? (
              <Button
                variant="secondary"
                onClick={confirmBatchDelete}
                disabled={batchDeleteMutation.isPending}
              >
                Delete selected ({selected.size})
              </Button>
            ) : null}
            <Link href="/signals/new">
              <Button>New signal</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          {Object.values(SignalStatus).map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={marketType} onChange={(e) => setMarketType(e.target.value)} className="w-40">
          <option value="">All markets</option>
          {Object.values(MarketType).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? <Spinner /> : null}
      {error ? <div className="text-red-400">Failed to load signals</div> : null}

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
              <Th>Market</Th>
              <Th>Status</Th>
              <Th>Entry</Th>
              <Th>Updated</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((signal) => (
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
                <Td>{signal.marketType}</Td>
                <Td>{signal.status}</Td>
                <Td>{signal.entryPrice}</Td>
                <Td>{new Date(signal.updatedAt).toLocaleString()}</Td>
                <Td className="space-x-2">
                  <Link href={`/signals/${signal.id}/edit`} className="text-indigo-400 hover:underline">
                    Edit
                  </Link>
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
            ))}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
