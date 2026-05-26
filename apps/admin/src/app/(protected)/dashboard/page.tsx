'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, PageHeader, Spinner, Table, Td, Th } from '@/components/ui';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  });

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-400">Failed to load dashboard</div>;

  const stats = [
    { label: 'Live signals', value: data?.live ?? 0 },
    { label: 'Closed', value: data?.closed ?? 0 },
    { label: 'Cancelled', value: data?.cancelled ?? 0 },
    { label: 'Reviews', value: data?.pendingReviews ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of QPulse activity" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="text-sm text-zinc-400">{stat.label}</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-50">{stat.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-zinc-100">Recent push events</h2>
        {!data?.recentPushEvents?.length ? (
          <p className="text-sm text-zinc-500">No recent notifications</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Time</Th>
              </tr>
            </thead>
            <tbody>
              {data.recentPushEvents.map((event) => (
                <tr key={event.id}>
                  <Td>{event.eventType}</Td>
                  <Td>{event.title}</Td>
                  <Td>{event.status}</Td>
                  <Td>{new Date(event.createdAt).toLocaleString()}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
