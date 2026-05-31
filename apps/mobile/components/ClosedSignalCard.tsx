import { StyleSheet, Text, View } from 'react-native';
import type { SignalDto } from '@qpulse/shared';
import { Direction } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface ClosedSignalCardProps {
  signal: SignalDto;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ClosedSignalCard({ signal }: ClosedSignalCardProps) {
  const themeColors = useAppStore((s) => s.colors);
  const profit = signal.profitPercentage ?? 0;
  const isProfit = profit >= 0;
  const profitColor = isProfit ? themeColors.success : themeColors.danger;

  let outcomeLabel = 'Closed';
  if (signal.liquidated) outcomeLabel = 'Liquidated';
  else if (signal.slHit) outcomeLabel = 'SL Hit';
  else if (signal.targetHitLabel) outcomeLabel = signal.targetHitLabel;

  const directionColor =
    signal.direction === Direction.LONG ? themeColors.long : themeColors.short;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.pair, { color: themeColors.text }]}>{signal.pair}</Text>
          <Text style={[styles.dates, { color: themeColors.textMuted }]}>
            {formatDate(signal.openDate)} → {formatDate(signal.closeDate)}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.profit, { color: profitColor }]}>
            {isProfit ? '+' : ''}
            {profit.toFixed(2)}%
          </Text>
          <View style={[styles.outcomeBadge, { borderColor: profitColor + '55' }]}>
            <Text style={[styles.outcomeText, { color: profitColor }]}>{outcomeLabel}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: themeColors.cardBorder }]}>
        {signal.direction && (
          <View style={[styles.chip, { backgroundColor: directionColor + '22' }]}>
            <Text style={[styles.chipText, { color: directionColor }]}>{signal.direction}</Text>
          </View>
        )}
        <Text style={[styles.entry, { color: themeColors.textSecondary }]}>Entry {signal.entryPrice}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pair: {
    fontSize: 16,
    fontWeight: '700',
  },
  dates: {
    fontSize: 12,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  profit: {
    fontSize: 18,
    fontWeight: '700',
  },
  outcomeBadge: {
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  outcomeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  entry: {
    fontSize: 12,
  },
});
