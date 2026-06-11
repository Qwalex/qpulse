import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SignalDto } from '@qpulse/shared';
import { Direction, SignalStatus } from '@qpulse/shared';
import { radii, spacing, type ThemeColors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

function resolveSignalColor(signal: SignalDto, themeColors: ThemeColors): string {
  if (signal.direction === Direction.LONG) return themeColors.long;
  if (signal.direction === Direction.SHORT) return themeColors.short;
  const action = signal.action?.toUpperCase();
  if (action === 'BUY') return themeColors.long;
  if (action === 'SELL') return themeColors.short;
  return themeColors.textMuted;
}

interface SignalCardProps {
  signal: SignalDto;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value: number): string {
  return value >= 1 ? value.toLocaleString('en-US', { maximumFractionDigits: 4 }) : value.toPrecision(4);
}

export function SignalCard({ signal }: SignalCardProps) {
  const themeColors = useAppStore((s) => s.colors);
  const expanded = useAppStore((s) => s.expandedSignalIds.has(signal.id));
  const toggleExpanded = useAppStore((s) => s.toggleExpanded);

  const directionColor = resolveSignalColor(signal, themeColors);
  const statusLabel = signal.status === SignalStatus.OPEN ? 'OPEN' : 'ACTIVE';

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
      onPress={() => toggleExpanded(signal.id)}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.pairRow}>
          <Text style={[styles.pair, { color: themeColors.text }]}>{signal.pair}</Text>
          <View style={[styles.badge, { backgroundColor: directionColor + '22' }]}>
            <Text style={[styles.badgeText, { color: directionColor }]}>
              {signal.direction ?? signal.action ?? '—'}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: themeColors.accent + '33' },
            signal.status === SignalStatus.ACTIVE && { backgroundColor: themeColors.warning + '33' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: themeColors.accent },
              signal.status === SignalStatus.ACTIVE && { color: themeColors.warning },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>Entry</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{formatPrice(signal.entryPrice)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>Capital</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{signal.capitalPercentage}%</Text>
      </View>
      {signal.leverage != null && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.textSecondary }]}>Leverage</Text>
          <Text style={[styles.value, { color: themeColors.text }]}>{signal.leverage}x</Text>
        </View>
      )}

      {expanded && signal.details && (
        <View style={[styles.details, { borderTopColor: themeColors.cardBorder }]}>
          {signal.details.targets.map((tp) => {
            const reached = tp.hit === true;
            const profitPercent = Number(tp.profitPercent ?? 0);
            return (
              <View key={tp.label} style={styles.row}>
                <Text style={[styles.label, { color: themeColors.textSecondary }, !reached && styles.labelMuted]}>
                  {tp.label}
                </Text>
                <Text
                  style={[
                    styles.value,
                    { color: themeColors.text },
                    reached ? { color: themeColors.success } : styles.valuePending,
                  ]}
                >
                  {reached ? '✓ ' : ''}
                  {formatPrice(tp.price)} ({profitPercent > 0 ? '+' : ''}
                  {profitPercent}%)
                </Text>
              </View>
            );
          })}
          {signal.details.stopLoss != null && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: themeColors.danger }]}>Stop Loss</Text>
              <Text
                style={[
                  styles.value,
                  { color: themeColors.danger },
                  signal.slHit ? { color: themeColors.success } : styles.valuePending,
                ]}
              >
                {signal.slHit ? '✓ ' : ''}
                {formatPrice(signal.details.stopLoss)}
              </Text>
            </View>
          )}
          <Text style={[styles.date, { color: themeColors.textMuted }]}>Opened {formatDate(signal.openDate)}</Text>
        </View>
      )}

      <View style={styles.expandHint}>
        <Text style={[styles.expandText, { color: themeColors.textMuted }]}>
          {expanded ? 'Collapse' : 'Details'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={themeColors.textMuted}
        />
      </View>
    </Pressable>
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  pair: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelMuted: {
    opacity: 0.65,
  },
  valuePending: {
    opacity: 0.75,
  },
  details: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  date: {
    fontSize: 12,
    marginTop: spacing.sm,
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  expandText: {
    fontSize: 12,
  },
});
