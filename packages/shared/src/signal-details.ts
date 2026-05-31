/** Shape aligned with SignalDetails / SignalTarget in index.ts */
export type SignalTargetShape = {
  label: string;
  price: number;
  profitPercent: number;
  hit?: boolean;
};

export type SignalDetailsShape = {
  targets: SignalTargetShape[];
  stopLoss?: number;
};

export function normalizeSignalTarget(raw: Partial<SignalTargetShape>): SignalTargetShape {
  return {
    label: String(raw.label ?? ''),
    price: Number(raw.price ?? 0),
    profitPercent: Number(raw.profitPercent ?? 0),
    hit: raw.hit === true,
  };
}

export function normalizeSignalDetails(raw: unknown): SignalDetailsShape | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const targets = Array.isArray(obj.targets)
    ? obj.targets.map((t) => normalizeSignalTarget(t as Partial<SignalTargetShape>))
    : [];
  const stopLoss =
    obj.stopLoss === undefined || obj.stopLoss === null ? undefined : Number(obj.stopLoss);
  return { targets, stopLoss };
}

export function deriveExecutionFields(
  details: SignalDetailsShape | null | undefined,
  slHit: boolean,
): {
  currentTpLevel: number | null;
  targetHitLabel: string | null;
  slHit: boolean;
} {
  const hitTargets = (details?.targets ?? [])
    .map((t, index) => ({ ...t, level: index + 1 }))
    .filter((t) => t.hit);

  const lastHit = hitTargets.at(-1);

  return {
    currentTpLevel: lastHit?.level ?? null,
    targetHitLabel: lastHit?.label ?? null,
    slHit,
  };
}

export function countTargetHits(details: SignalDetailsShape | null | undefined): number {
  return (details?.targets ?? []).filter((t) => t.hit).length;
}

export function hasNewTargetHit(
  before: SignalDetailsShape | null | undefined,
  after: SignalDetailsShape | null | undefined,
): boolean {
  const b = before?.targets ?? [];
  const a = after?.targets ?? [];
  for (let i = 0; i < a.length; i++) {
    if (a[i].hit && !b[i]?.hit) return true;
  }
  return countTargetHits(after) > countTargetHits(before);
}
