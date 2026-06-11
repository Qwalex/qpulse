export type ProfitEmulationPeriod = 'week' | 'month' | 'year';

export type ProfitEmulationProjection = Record<ProfitEmulationPeriod, number>;

export type ResultsSummaryProfitInput = {
  totalTrades: number;
  totalProfit: number;
};

/** Matches dashboard Results fetch window (`3M`). */
export const DASHBOARD_RESULTS_PERIOD_DAYS = 90;

/** Weighted average total profit % across markets with closed signals. */
export function resolveEmulationTotalProfitPercent(
  ...summaries: (ResultsSummaryProfitInput | undefined)[]
): number | null {
  const active = summaries.filter(
    (summary): summary is ResultsSummaryProfitInput =>
      summary != null && summary.totalTrades > 0,
  );
  if (active.length === 0) return null;

  const totalTrades = active.reduce((sum, item) => sum + item.totalTrades, 0);
  const weightedProfit = active.reduce(
    (sum, item) => sum + item.totalProfit * item.totalTrades,
    0,
  );
  return Math.round((weightedProfit / totalTrades) * 100) / 100;
}

/**
 * Linear extrapolation of signal total profit % from a source window (default 3M).
 * Example: +30% over 90d → $300 profit on $1000 over 90d → ~$23.33/month.
 */
export function emulateProfitUsd(
  capitalUsd: number,
  totalProfitPercent: number,
  sourcePeriodDays = DASHBOARD_RESULTS_PERIOD_DAYS,
): ProfitEmulationProjection {
  const profitInSourceWindow = capitalUsd * (totalProfitPercent / 100);

  return {
    week: roundUsd(profitInSourceWindow * (7 / sourcePeriodDays)),
    month: roundUsd(profitInSourceWindow * (30 / sourcePeriodDays)),
    year: roundUsd(profitInSourceWindow * (365 / sourcePeriodDays)),
  };
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}
