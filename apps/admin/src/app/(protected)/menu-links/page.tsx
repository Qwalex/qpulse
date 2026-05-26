'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MenuActionType, type MenuLinkDto } from '@qpulse/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
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

const menuSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
  actionType: z.nativeEnum(MenuActionType),
  url: z.string().optional(),
  route: z.string().optional(),
  order: z.coerce.number().int(),
  isEnabled: z.boolean(),
});

type MenuForm = z.infer<typeof menuSchema>;

function MenuFormPanel({
  initial,
  onDone,
}: {
  initial?: MenuLinkDto;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: initial
      ? {
          id: initial.id,
          label: initial.label,
          icon: initial.icon,
          actionType: initial.actionType,
          url: initial.url ?? '',
          route: initial.route ?? '',
          order: initial.order,
          isEnabled: initial.isEnabled,
        }
      : {
          id: crypto.randomUUID(),
          label: '',
          icon: 'link',
          actionType: MenuActionType.EXTERNAL_LINK,
          url: '',
          route: '',
          order: 0,
          isEnabled: true,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: MenuForm) =>
      initial ? api.menuLinks.update(initial.id, values) : api.menuLinks.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['menu-links'] });
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
        className="grid gap-4 md:grid-cols-2"
      >
        <div>
          <Label>ID</Label>
          <Input {...register('id')} disabled={!!initial} />
        </div>
        <div>
          <Label>Label</Label>
          <Input {...register('label')} />
        </div>
        <div>
          <Label>Icon</Label>
          <Input {...register('icon')} />
        </div>
        <div>
          <Label>Action type</Label>
          <Select {...register('actionType')}>
            {Object.values(MenuActionType).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>URL</Label>
          <Input {...register('url')} />
        </div>
        <div>
          <Label>Route</Label>
          <Input {...register('route')} />
        </div>
        <div>
          <Label>Order</Label>
          <Input type="number" {...register('order')} />
        </div>
        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isEnabled')} />
            Enabled
          </label>
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            Save
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

export default function MenuLinksPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editing, setEditing] = useState<MenuLinkDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['menu-links'],
    queryFn: () => api.menuLinks.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.menuLinks.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['menu-links'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Menu links"
        description="Configure mobile app navigation items"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setMode('create');
            }}
          >
            Add link
          </Button>
        }
      />

      {mode !== 'list' ? (
        <MenuFormPanel
          initial={mode === 'edit' ? editing ?? undefined : undefined}
          onDone={() => setMode('list')}
        />
      ) : null}

      {isLoading ? <Spinner /> : null}

      {data ? (
        <Table>
          <thead>
            <tr>
              <Th>Label</Th>
              <Th>Type</Th>
              <Th>Order</Th>
              <Th>Enabled</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((link) => (
              <tr key={link.id}>
                <Td>{link.label}</Td>
                <Td>{link.actionType}</Td>
                <Td>{link.order}</Td>
                <Td>{link.isEnabled ? 'Yes' : 'No'}</Td>
                <Td className="space-x-2">
                  <button
                    type="button"
                    className="text-indigo-400 hover:underline"
                    onClick={() => {
                      setEditing(link);
                      setMode('edit');
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:underline"
                    onClick={() => {
                      if (confirm('Delete this link?')) {
                        deleteMutation.mutate(link.id);
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
