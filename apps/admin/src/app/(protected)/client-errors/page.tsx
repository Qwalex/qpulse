'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader, Spinner, Table, Td, Th } from '@/components/ui';

export default function ClientErrorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['client-errors'],
    queryFn: () => api.clientErrors.list(200),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <PageHeader
        title="Client errors"
        description="Mobile app render and API failures reported from production builds"
      />

      {isLoading ? <Spinner /> : null}

      {data ? (
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Kind</Th>
              <Th>Message</Th>
              <Th>Path / screen</Th>
              <Th>Device</Th>
              <Th>Platform</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <Td className="whitespace-nowrap text-xs">
                  {new Date(row.createdAt).toLocaleString()}
                </Td>
                <Td>{row.kind}</Td>
                <Td className="max-w-md truncate">{row.message}</Td>
                <Td className="font-mono text-xs">{row.apiPath ?? row.screen ?? '—'}</Td>
                <Td className="font-mono text-xs">{row.deviceId ?? '—'}</Td>
                <Td>
                  {row.platform ?? '—'}
                  {row.appVersion ? ` · ${row.appVersion}` : ''}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}

      {data?.length === 0 ? <p className="text-sm text-zinc-500">No client errors yet</p> : null}
    </div>
  );
}
