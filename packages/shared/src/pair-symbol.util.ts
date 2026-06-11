/** Normalize signal pair label to Bybit symbol (e.g. ADA/USDT → ADAUSDT). */
export function pairToBybitSymbol(pair: string): string {
  const trimmed = pair.trim().toUpperCase();
  if (!trimmed) return '';
  if (trimmed.includes('/')) {
    return trimmed.replace(/\s+/g, '').replace('/', '');
  }
  return trimmed.replace(/\s+/g, '');
}

/** Display label from Bybit symbol (e.g. BTCUSDT → BTC/USDT). */
export function bybitSymbolToPairLabel(symbol: string): string {
  const upper = symbol.trim().toUpperCase();
  if (upper.endsWith('USDT')) {
    const base = upper.slice(0, -4);
    return `${base}/USDT`;
  }
  if (upper.endsWith('USDC')) {
    const base = upper.slice(0, -4);
    return `${base}/USDC`;
  }
  return upper;
}
