import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ResultsSummaryDto } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface DashboardResultsSummaryProps {
  summary?: ResultsSummaryDto;
  isLoading?: boolean;
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const themeColors = useAppStore((s) => s.colors);

  return (
    <View style={[styles.stat, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: accent ?? themeColors.text }]}>{value}</Text>
    </View>
  );
}

export function DashboardResultsSummary({ summary, isLoading }: DashboardResultsSummaryProps) {
  const themeColors = useAppStore((s) => s.colors);

  const profitColor =
    summary && summary.totalProfit >= 0 ? themeColors.success : themeColors.danger;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bar-chart-outline" size={18} color={themeColors.accent} />
          <Text style={[styles.title, { color: themeColors.text }]}>Signal Results</Text>
        </View>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>Last 3 months · Spot</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={themeColors.accent} style={styles.loader} />
      ) : summary ? (
        <>
          <View style={styles.grid}>
            <MiniStat label="Trades" value={String(summary.totalTrades)} />
            <MiniStat
              label="Win Rate"
              value={`${summary.winRate.toFixed(1)}%`}
              accent={themeColors.accent}
            />
            <MiniStat label="Wins" value={String(summary.winTrades)} accent={themeColors.success} />
            <MiniStat label="Losses" value={String(summary.lossTrades)} accent={themeColors.danger} />
          </View>
          <View style={[styles.profitRow, { borderTopColor: themeColors.cardBorder }]}>
            <Text style={[styles.profitLabel, { color: themeColors.textSecondary }]}>
              Total profit
            </Text>
            <Text style={[styles.profitValue, { color: profitColor }]}>
              {summary.totalProfit >= 0 ? '+' : ''}
              {summary.totalProfit.toFixed(2)}%
            </Text>
          </View>
        </>
      ) : (
        <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
          Results data unavailable
        </Text>
      )}

      <Link href="/results" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: themeColors.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: themeColors.textOnAccent }]}>Results</Text>
          <Ionicons name="arrow-forward" size={16} color={themeColors.textOnAccent} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 26,
  },
  loader: {
    marginVertical: spacing.lg,
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
    fontSize: 11,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  profitLabel: {
    fontSize: 14,
  },
  profitValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
