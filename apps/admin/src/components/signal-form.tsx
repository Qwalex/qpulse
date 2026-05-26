'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Direction, MarketType, SignalStatus, type SignalDto } from '@qpulse/shared';
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui';

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
  currentTpLevel: z.coerce.number().optional().nullable(),
  slHit: z.boolean().optional(),
  liquidated: z.boolean().optional(),
  targetHitLabel: z.string().optional(),
  profitPercentage: z.coerce.number().optional().nullable(),
  logoUrl: z.string().optional(),
  detailsJson: z.string().optional(),
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
      currentTpLevel: null,
      slHit: false,
      liquidated: false,
      targetHitLabel: '',
      profitPercentage: null,
      logoUrl: '',
      detailsJson: JSON.stringify({ targets: [] }, null, 2),
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
    currentTpLevel: signal.currentTpLevel ?? null,
    slHit: signal.slHit,
    liquidated: signal.liquidated,
    targetHitLabel: signal.targetHitLabel ?? '',
    profitPercentage: signal.profitPercentage ?? null,
    logoUrl: signal.logoUrl ?? '',
    detailsJson: JSON.stringify(signal.details ?? { targets: [] }, null, 2),
  };
}

function toApiPayload(values: SignalFormValues): Record<string, unknown> {
  let details: unknown = undefined;
  if (values.detailsJson?.trim()) {
    details = JSON.parse(values.detailsJson);
  }

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
    currentTpLevel: values.currentTpLevel ?? null,
    slHit: values.slHit ?? false,
    liquidated: values.liquidated ?? false,
    targetHitLabel: values.targetHitLabel || null,
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
    formState: { errors },
  } = useForm<SignalFormValues>({
    resolver: zodResolver(signalSchema),
    defaultValues: toFormValues(initial),
  });

  const submit = handleSubmit((values) => {
    try {
      onSubmit(toApiPayload(values));
    } catch {
      alert('Invalid JSON in details field');
    }
  });

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
        <div className="md:col-span-2">
          <Label>Details (JSON)</Label>
          <Textarea rows={8} className="font-mono text-xs" {...register('detailsJson')} />
        </div>
        <div className="flex items-center gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" {...register('slHit')} />
            SL hit
          </label>
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
