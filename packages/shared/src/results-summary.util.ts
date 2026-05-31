export type ResultsSummaryComputed = {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  totalProfit: number;
};

export type ResultsSummarySignalInput = {
  profitPercentage?: number | null;
};

export function computeResultsSummary(signals: ResultsSummarySignalInput[]): ResultsSummaryComputed {
  const totalTrades = signals.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      winRate: 0,
      totalProfit: 0,
    };
  }

  const winTrades = signals.filter((s) => (s.profitPercentage ?? 0) > 0).length;
  const lossTrades = totalTrades - winTrades;
  const winRate = Math.round((winTrades / totalTrades) * 1000) / 10;
  const totalProfit =
    Math.round(signals.reduce((sum, s) => sum + (s.profitPercentage ?? 0), 0) * 100) / 100;

  return {
    totalTrades,
    winTrades,
    lossTrades,
    winRate,
    totalProfit,
  };
}
