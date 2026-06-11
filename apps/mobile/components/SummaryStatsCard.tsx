import { StyleSheet, Text, View } from 'react-native';
import type { ResultsSummaryDto } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface SummaryStatsCardProps {
  summary: ResultsSummaryDto;
}

function StatItem({
  label,
  value,
  accent,
  themeColors,
}: {
  label: string;
  value: string;
  accent?: string;
  themeColors: ReturnType<typeof useAppStore.getState>['colors'];
}) {
  return (
    <View style={[styles.stat, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accent ?? themeColors.text }]}>{value}</Text>
    </View>
  );
}

export function SummaryStatsCard({ summary }: SummaryStatsCardProps) {
  const themeColors = useAppStore((s) => s.colors);
  const profitColor = summary.totalProfit >= 0 ? themeColors.success : themeColors.danger;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>Statistics</Text>
      <View style={styles.grid}>
        <StatItem label="Trades" value={String(summary.totalTrades)} themeColors={themeColors} />
        <StatItem
          label="Win Rate"
          value={`${summary.winRate.toFixed(1)}%`}
          accent={themeColors.accent}
          themeColors={themeColors}
        />
        <StatItem
          label="Wins"
          value={String(summary.winTrades)}
          accent={themeColors.success}
          themeColors={themeColors}
        />
        <StatItem
          label="Losses"
          value={String(summary.lossTrades)}
          accent={themeColors.danger}
          themeColors={themeColors}
        />
      </View>
      <View style={[styles.totalRow, { borderTopColor: themeColors.cardBorder }]}>
        <Text style={[styles.totalLabel, { color: themeColors.textSecondary }]}>Total profit</Text>
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
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  title: {
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
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
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
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
