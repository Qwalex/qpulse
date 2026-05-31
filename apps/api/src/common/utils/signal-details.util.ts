import {
  deriveExecutionFields,
  normalizeSignalDetails,
  type SignalDetailsShape,
} from '@qpulse/shared';

export function applyDetailsExecutionFields(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const slHit = (data.slHit as boolean) ?? false;
  const details = normalizeSignalDetails(data.details);
  if (!details) return data;

  const derived = deriveExecutionFields(details, slHit);
  return {
    ...data,
    details,
    currentTpLevel: derived.currentTpLevel,
    targetHitLabel: derived.targetHitLabel,
    slHit: derived.slHit,
  };
}

export function parseSignalDetails(value: unknown): SignalDetailsShape | null {
  return normalizeSignalDetails(value);
}
