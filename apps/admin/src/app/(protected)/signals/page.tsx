'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MarketType, SignalStatus } from '@qpulse/shared';
import { api } from '@/lib/api';
import { Button, PageHeader, Select, Spinner, Table, Td, Th } from '@/components/ui';
import { useState } from 'react';

export default function SignalsPage() {
  const [status, setStatus] = useState('');
  const [marketType, setMarketType] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['signals', status, marketType],
    queryFn: () =>
      api.signals.list({
        status: status || undefined,
        marketType: marketType || undefined,
      }),
  });

  return (
    <div>
      <PageHeader
        title="Signals"
        description="Manage trading signals"
        actions={
          <Link href="/signals/new">
            <Button>New signal</Button>
          </Link>
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
                <Td>{signal.pair}</Td>
                <Td>{signal.marketType}</Td>
                <Td>{signal.status}</Td>
                <Td>{signal.entryPrice}</Td>
                <Td>{new Date(signal.updatedAt).toLocaleString()}</Td>
                <Td>
                  <Link href={`/signals/${signal.id}/edit`} className="text-indigo-400 hover:underline">
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
