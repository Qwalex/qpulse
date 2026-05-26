'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, PageHeader, Spinner, Table, Td, Th } from '@/components/ui';

export default function ReviewsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => api.reviews.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.reviews.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  return (
    <div>
      <PageHeader title="Reviews" description="User ratings and comments" />

      {isLoading ? <Spinner /> : null}

      {data ? (
        <Table>
          <thead>
            <tr>
              <Th>Rating</Th>
              <Th>Comment</Th>
              <Th>Device</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((review) => (
              <tr key={review.id}>
                <Td>{'★'.repeat(review.rating)}</Td>
                <Td>{review.comment ?? '—'}</Td>
                <Td className="font-mono text-xs">{review.deviceId ?? '—'}</Td>
                <Td>{new Date(review.createdAt).toLocaleString()}</Td>
                <Td>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Delete this review?')) {
                        deleteMutation.mutate(review.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}

      {data?.length === 0 ? <p className="text-sm text-zinc-500">No reviews yet</p> : null}
    </div>
  );
}
