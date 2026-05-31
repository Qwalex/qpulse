'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  deriveExecutionFields,
  Direction,
  MarketType,
  SignalStatus,
  type SignalDto,
} from '@qpulse/shared';
import { Button, Card, Input, Label, Select } from '@/components/ui';

const targetSchema = z.object({
  label: z.string().min(1),
  price: z.coerce.number(),
  profitPercent: z.coerce.number(),
  hit: z.boolean(),
});

const signalSchema = z.object({
  pair: z.string().min(1),
  marketType: z.nativeEnum(MarketType),
  direction: z.nativeEnum(Direction).optional().nullable(),
  action: z.string().optional(),
  entryPrice: z.coerce.number().positive(),
  capitalPercentage: z.coerce.number().min(0),
  leverage: z.coerce.number().optional().nullable(),
  openDate: z.string().min(1),
  closeDate: z.string().optional(),
  status: z.nativeEnum(SignalStatus),
  slHit: z.boolean(),
  liquidated: z.boolean(),
  profitPercentage: z.coerce.number().optional().nullable(),
  logoUrl: z.string().optional(),
  stopLoss: z.string().optional(),
  targets: z.array(targetSchema),
});

type SignalFormValues = z.infer<typeof signalSchema>;

function toFormValues(signal?: SignalDto): SignalFormValues {
  if (!signal) {
    return {
      pair: '',
      marketType: MarketType.SPOT,
      direction: Direction.LONG,
      action: '',
      entryPrice: 0,
      capitalPercentage: 1,
      leverage: null,
      openDate: new Date().toISOString().slice(0, 16),
      closeDate: '',
      status: SignalStatus.OPEN,
      slHit: false,
      liquidated: false,
      profitPercentage: null,
      logoUrl: '',
      stopLoss: '',
      targets: [],
    };
  }

  return {
    pair: signal.pair,
    marketType: signal.marketType,
    direction: signal.direction ?? Direction.LONG,
    action: signal.action ?? '',
    entryPrice: signal.entryPrice,
    capitalPercentage: signal.capitalPercentage,
    leverage: signal.leverage ?? null,
    openDate: signal.openDate.slice(0, 16),
    closeDate: signal.closeDate?.slice(0, 16) ?? '',
    status: signal.status,
    slHit: signal.slHit,
    liquidated: signal.liquidated,
    profitPercentage: signal.profitPercentage ?? null,
    logoUrl: signal.logoUrl ?? '',
    stopLoss: signal.details?.stopLoss != null ? String(signal.details.stopLoss) : '',
    targets: (signal.details?.targets ?? []).map((t) => ({
      label: t.label,
      price: t.price,
      profitPercent: t.profitPercent,
      hit: t.hit === true,
    })),
  };
}

function parseStopLoss(raw?: string): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

function toApiPayload(values: SignalFormValues): Record<string, unknown> {
  const stopLoss = parseStopLoss(values.stopLoss);
  const details = {
    targets: values.targets.map((t) => ({
      label: t.label,
      price: t.price,
      profitPercent: t.profitPercent,
      hit: t.hit,
    })),
    ...(stopLoss !== undefined ? { stopLoss } : {}),
  };

  const derived = deriveExecutionFields(details, values.slHit);

  return {
    pair: values.pair,
    marketType: values.marketType,
    direction: values.direction || null,
    action: values.action || null,
    entryPrice: values.entryPrice,
    capitalPercentage: values.capitalPercentage,
    leverage: values.leverage ?? null,
    openDate: new Date(values.openDate).toISOString(),
    closeDate: values.closeDate ? new Date(values.closeDate).toISOString() : null,
    status: values.status,
    currentTpLevel: derived.currentTpLevel,
    slHit: derived.slHit,
    liquidated: values.liquidated,
    targetHitLabel: derived.targetHitLabel,
    profitPercentage: values.profitPercentage ?? null,
    logoUrl: values.logoUrl || null,
    details,
  };
}

export function SignalForm({
  initial,
  onSubmit,
  isSubmitting,
}: {
  initial?: SignalDto;
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SignalFormValues>({
    resolver: zodResolver(signalSchema),
    defaultValues: toFormValues(initial),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'targets' });
  const stopLossValue = watch('stopLoss');
  const hasStopLoss = !!stopLossValue?.trim() && !Number.isNaN(Number(stopLossValue));

  const submit = handleSubmit((values) => onSubmit(toApiPayload(values)));

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Pair</Label>
          <Input {...register('pair')} />
          {errors.pair ? <p className="text-xs text-red-400">{errors.pair.message}</p> : null}
        </div>
        <div>
          <Label>Market type</Label>
          <Select {...register('marketType')}>
            {Object.values(MarketType).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Direction</Label>
          <Select {...register('direction')}>
            <option value="">—</option>
            {Object.values(Direction).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select {...register('status')}>
            {Object.values(SignalStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Entry price</Label>
          <Input type="number" step="any" {...register('entryPrice')} />
        </div>
        <div>
          <Label>Capital %</Label>
          <Input type="number" step="any" {...register('capitalPercentage')} />
        </div>
        <div>
          <Label>Leverage</Label>
          <Input type="number" {...register('leverage')} />
        </div>
        <div>
          <Label>Action</Label>
          <Input {...register('action')} />
        </div>
        <div>
          <Label>Open date</Label>
          <Input type="datetime-local" {...register('openDate')} />
        </div>
        <div>
          <Label>Close date</Label>
          <Input type="datetime-local" {...register('closeDate')} />
        </div>
        <div>
          <Label>Profit %</Label>
          <Input type="number" step="any" {...register('profitPercentage')} />
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input {...register('logoUrl')} />
        </div>

        <div className="md:col-span-2 space-y-3 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-200">Take-profit targets</span>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({
                  label: `Target ${String(fields.length + 1).padStart(2, '0')}`,
                  price: 0,
                  profitPercent: 0,
                  hit: false,
                })
              }
            >
              + Target
            </Button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-zinc-500">No targets — add TP levels.</p>
          ) : null}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border border-zinc-800/80 bg-zinc-900/40 p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
            >
              <div>
                <span className="text-xs text-zinc-400">Label</span>
                <Input {...register(`targets.${index}.label`)} />
              </div>
              <div>
                <span className="text-xs text-zinc-400">Price</span>
                <Input type="number" step="any" {...register(`targets.${index}.price`)} />
              </div>
              <div>
                <span className="text-xs text-zinc-400">Profit %</span>
                <Input type="number" step="any" {...register(`targets.${index}.profitPercent`)} />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
                <input type="checkbox" {...register(`targets.${index}.hit`)} />
                Reached
              </label>
              <Button type="button" variant="secondary" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 space-y-3 rounded-lg border border-zinc-800 p-4">
          <span className="text-sm font-medium text-zinc-200">Stop Loss</span>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[12rem] flex-1">
              <span className="text-xs text-zinc-400">Price</span>
              <Input type="number" step="any" {...register('stopLoss')} placeholder="Not set" />
            </div>
            {hasStopLoss ? (
              <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
                <input type="checkbox" {...register('slHit')} />
                SL reached
              </label>
            ) : (
              <p className="pb-2 text-sm text-zinc-500">Set an SL price to mark it as reached.</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" {...register('liquidated')} />
            Liquidated
          </label>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save signal'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
