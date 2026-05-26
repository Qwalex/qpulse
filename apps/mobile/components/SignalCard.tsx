import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SignalDto } from '@qpulse/shared';
import { Direction, SignalStatus } from '@qpulse/shared';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface SignalCardProps {
  signal: SignalDto;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
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
  const expanded = useAppStore((s) => s.expandedSignalIds.has(signal.id));
  const toggleExpanded = useAppStore((s) => s.toggleExpanded);

  const isLong = signal.direction === Direction.LONG;
  const directionColor = isLong ? colors.long : colors.short;
  const statusLabel = signal.status === SignalStatus.OPEN ? 'OPEN' : 'ACTIVE';

  return (
    <Pressable
      style={styles.card}
      onPress={() => toggleExpanded(signal.id)}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.pairRow}>
          <Text style={styles.pair}>{signal.pair}</Text>
          <View style={[styles.badge, { backgroundColor: directionColor + '22' }]}>
            <Text style={[styles.badgeText, { color: directionColor }]}>
              {signal.direction ?? signal.action ?? '—'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, signal.status === SignalStatus.ACTIVE && styles.statusActive]}>
          <Text style={[styles.statusText, signal.status === SignalStatus.ACTIVE && styles.statusTextActive]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Entry</Text>
        <Text style={styles.value}>{formatPrice(signal.entryPrice)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Capital</Text>
        <Text style={styles.value}>{signal.capitalPercentage}%</Text>
      </View>
      {signal.leverage != null && (
        <View style={styles.row}>
          <Text style={styles.label}>Leverage</Text>
          <Text style={styles.value}>{signal.leverage}x</Text>
        </View>
      )}

      {expanded && signal.details && (
        <View style={styles.details}>
          {signal.details.targets.map((tp) => (
            <View key={tp.label} style={styles.row}>
              <Text style={styles.label}>{tp.label}</Text>
              <Text style={styles.value}>
                {formatPrice(tp.price)} ({tp.profitPercent > 0 ? '+' : ''}
                {tp.profitPercent}%)
              </Text>
            </View>
          ))}
          {signal.details.stopLoss != null && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.danger }]}>Stop Loss</Text>
              <Text style={[styles.value, { color: colors.danger }]}>
                {formatPrice(signal.details.stopLoss)}
              </Text>
            </View>
          )}
          <Text style={styles.date}>Opened {formatDate(signal.openDate)}</Text>
        </View>
      )}

      <View style={styles.expandHint}>
        <Text style={styles.expandText}>{expanded ? 'Свернуть' : 'Подробнее'}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
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
    backgroundColor: colors.accent + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  statusActive: {
    backgroundColor: colors.warning + '33',
  },
  statusText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: colors.warning,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  date: {
    color: colors.textMuted,
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
    color: colors.textMuted,
    fontSize: 12,
  },
});
