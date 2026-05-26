'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api, ApiError, type NotificationTemplateRow } from '@/lib/api';
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Spinner,
  Table,
  Td,
  Textarea,
  Th,
} from '@/components/ui';
import { useState } from 'react';

function TemplateEditor({
  template,
  onDone,
}: {
  template: NotificationTemplateRow;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm({
    defaultValues: template,
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      api.notifications.updateTemplate(template.eventType, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      onDone();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    },
  });

  return (
    <Card className="mb-6">
      <h3 className="mb-4 font-medium text-zinc-100">{template.eventType}</h3>
      <form
        onSubmit={handleSubmit((values) => {
          setError(null);
          mutation.mutate(values as unknown as Record<string, unknown>);
        })}
        className="grid gap-4 md:grid-cols-2"
      >
        <div>
          <Label>Title template</Label>
          <Input {...register('titleTpl')} />
        </div>
        <div>
          <Label>Channel</Label>
          <Input {...register('channel')} />
        </div>
        <div className="md:col-span-2">
          <Label>Body template</Label>
          <Textarea rows={3} {...register('bodyTpl')} />
        </div>
        <div>
          <Label>Priority</Label>
          <Input {...register('priority')} />
        </div>
        <div>
          <Label>Deep link</Label>
          <Input {...register('deepLink')} />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            Save template
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        {error ? (
          <div className="md:col-span-2">
            <Alert>{error}</Alert>
          </div>
        ) : null}
      </form>
    </Card>
  );
}

export default function NotificationsPage() {
  const [editing, setEditing] = useState<NotificationTemplateRow | null>(null);

  const templatesQuery = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => api.notifications.templates(),
  });

  const logsQuery = useQuery({
    queryKey: ['notification-log'],
    queryFn: () => api.notifications.log(),
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Push templates and delivery log"
      />

      <h2 className="mb-3 text-lg font-medium text-zinc-100">Templates</h2>
      {editing ? (
        <TemplateEditor template={editing} onDone={() => setEditing(null)} />
      ) : null}

      {templatesQuery.isLoading ? <Spinner /> : null}

      {templatesQuery.data ? (
        <Table>
          <thead>
            <tr>
              <Th>Event</Th>
              <Th>Title</Th>
              <Th>Channel</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {templatesQuery.data.map((tpl) => (
              <tr key={tpl.eventType}>
                <Td>{tpl.eventType}</Td>
                <Td>{tpl.titleTpl}</Td>
                <Td>{tpl.channel}</Td>
                <Td>
                  <button
                    type="button"
                    className="text-indigo-400 hover:underline"
                    onClick={() => setEditing(tpl)}
                  >
                    Edit
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}

      <h2 className="mb-3 mt-10 text-lg font-medium text-zinc-100">Delivery log</h2>
      {logsQuery.isLoading ? <Spinner /> : null}

      {logsQuery.data ? (
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
            {logsQuery.data.map((log) => (
              <tr key={log.id}>
                <Td>{log.eventType}</Td>
                <Td>{log.title}</Td>
                <Td>{log.status}</Td>
                <Td>{new Date(log.createdAt).toLocaleString()}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
