import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MarketMetricsDto } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface MarketMetricsSectionProps {
  metrics: MarketMetricsDto;
}

function fearGreedColor(value: number): string {
  if (value <= 24) return '#EF4444';
  if (value <= 44) return '#F97316';
  if (value <= 55) return '#EAB308';
  if (value <= 74) return '#84CC16';
  return '#22C55E';
}

function altcoinSeasonColor(value: number): string {
  if (value <= 25) return '#F7931A';
  if (value <= 49) return '#FB923C';
  if (value <= 74) return '#A78BFA';
  return '#8B5CF6';
}

function IndexGauge({
  label,
  value,
  subtitle,
  color,
  icon,
}: {
  label: string;
  value: number;
  subtitle: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const themeColors = useAppStore((s) => s.colors);
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View
      style={[
        styles.gaugeCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <View style={styles.gaugeHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.gaugeLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.gaugeValue, { color: themeColors.text }]}>{clamped}</Text>
      <Text style={[styles.gaugeSubtitle, { color }]} numberOfLines={1}>
        {subtitle}
      </Text>
      <View style={[styles.track, { backgroundColor: themeColors.background }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function MarketMetricsSection({ metrics }: MarketMetricsSectionProps) {
  const themeColors = useAppStore((s) => s.colors);
  const change = Number(metrics.totalMarketCapChange24h ?? 0);
  const changePositive = change >= 0;
  const changeColor = changePositive ? themeColors.success : themeColors.danger;
  const fgColor = fearGreedColor(Number(metrics.fearGreedValue ?? 0));
  const asColor = altcoinSeasonColor(Number(metrics.altcoinSeasonIndex ?? 0));

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Market Overview</Text>

      <View
        style={[
          styles.capCard,
          { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
        ]}
      >
        <View style={styles.capHeader}>
          <View style={[styles.capIconWrap, { backgroundColor: themeColors.accent + '18' }]}>
            <Ionicons name="globe-outline" size={20} color={themeColors.accent} />
          </View>
          <Text style={[styles.capLabel, { color: themeColors.textSecondary }]}>
            Total Market Cap
          </Text>
        </View>
        <Text style={[styles.capValue, { color: themeColors.text }]}>{metrics.totalMarketCap}</Text>
        <View style={[styles.changeBadge, { backgroundColor: changeColor + '18' }]}>
          <Ionicons
            name={changePositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={changeColor}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {changePositive ? '+' : ''}
            {change.toFixed(2)}% (24h)
          </Text>
        </View>
      </View>

      <View style={styles.gaugeRow}>
        <IndexGauge
          label="Altcoin Season"
          value={Number(metrics.altcoinSeasonIndex ?? 0)}
          subtitle={metrics.altcoinSeasonLabel ?? '—'}
          color={asColor}
          icon="layers-outline"
        />
        <IndexGauge
          label="Fear & Greed"
          value={Number(metrics.fearGreedValue ?? 0)}
          subtitle={metrics.fearGreedLabel ?? '—'}
          color={fgColor}
          icon="pulse-outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  capCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  capHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  capIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  capValue: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gaugeCard: {
    flex: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  gaugeValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  gaugeSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
});
