import { StyleSheet, Text, View } from 'react-native';
import type { ResultsSummaryDto } from '@qpulse/shared';
import { colors, radii, spacing } from '@/constants/theme';

interface SummaryStatsCardProps {
  summary: ResultsSummaryDto;
}

function StatItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

export function SummaryStatsCard({ summary }: SummaryStatsCardProps) {
  const profitColor = summary.totalProfit >= 0 ? colors.success : colors.danger;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Statistics</Text>
      <View style={styles.grid}>
        <StatItem label="Trades" value={String(summary.totalTrades)} />
        <StatItem label="Win Rate" value={`${summary.winRate.toFixed(1)}%`} accent={colors.accent} />
        <StatItem label="Wins" value={String(summary.winTrades)} accent={colors.success} />
        <StatItem label="Losses" value={String(summary.lossTrades)} accent={colors.danger} />
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total profit</Text>
        <Text style={[styles.totalValue, { color: profitColor }]}>
          {summary.totalProfit >= 0 ? '+' : ''}
          {summary.totalProfit.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
