import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ResultsSummaryDto } from '@qpulse/shared';
import {
  DASHBOARD_RESULTS_PERIOD_DAYS,
  emulateProfitUsd,
  resolveEmulationTotalProfitPercent,
} from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface ProfitEmulationCardProps {
  futuresSummary?: ResultsSummaryDto;
  spotSummary?: ResultsSummaryDto;
  isLoading?: boolean;
}

const DEFAULT_CAPITAL = '1000';

function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseCapitalInput(raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function ProjectionRow({
  label,
  value,
  profitColor,
}: {
  label: string;
  value: number;
  profitColor: string;
}) {
  const themeColors = useAppStore((s) => s.colors);

  return (
    <View style={[styles.projectionRow, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.projectionLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      <Text style={[styles.projectionValue, { color: profitColor }]}>{formatUsd(value)}</Text>
    </View>
  );
}

export function ProfitEmulationCard({
  futuresSummary,
  spotSummary,
  isLoading,
}: ProfitEmulationCardProps) {
  const themeColors = useAppStore((s) => s.colors);
  const [capitalInput, setCapitalInput] = useState(DEFAULT_CAPITAL);

  const totalProfitPercent = useMemo(
    () => resolveEmulationTotalProfitPercent(futuresSummary, spotSummary),
    [futuresSummary, spotSummary],
  );

  const capitalUsd = parseCapitalInput(capitalInput);
  const projection =
    totalProfitPercent != null && capitalUsd != null
      ? emulateProfitUsd(capitalUsd, totalProfitPercent, DASHBOARD_RESULTS_PERIOD_DAYS)
      : null;

  const profitColor =
    totalProfitPercent != null && totalProfitPercent >= 0
      ? themeColors.success
      : themeColors.danger;

  if (!isLoading && totalProfitPercent == null) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name="calculator-outline" size={18} color={themeColors.accent} />
        <Text style={[styles.title, { color: themeColors.text }]}>Profit Emulation</Text>
      </View>

      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
        Based on last 3 months total profit (
        {totalProfitPercent != null ? `${totalProfitPercent >= 0 ? '+' : ''}${totalProfitPercent.toFixed(2)}%` : '—'}
        )
      </Text>

      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Your capital</Text>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: themeColors.background, borderColor: themeColors.cardBorder },
        ]}
      >
        <Text style={[styles.inputPrefix, { color: themeColors.textMuted }]}>$</Text>
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          value={capitalInput}
          onChangeText={setCapitalInput}
          keyboardType="decimal-pad"
          placeholder="1000"
          placeholderTextColor={themeColors.textMuted}
          accessibilityLabel="Capital amount in USD"
        />
      </View>

      {capitalUsd == null && (
        <Text style={[styles.hint, { color: themeColors.danger }]}>
          Enter a valid amount greater than 0
        </Text>
      )}

      {projection && (
        <View style={styles.projections}>
          <ProjectionRow label="1 Week" value={projection.week} profitColor={profitColor} />
          <ProjectionRow label="1 Month" value={projection.month} profitColor={profitColor} />
          <ProjectionRow label="1 Year" value={projection.year} profitColor={profitColor} />
        </View>
      )}

      <Text style={[styles.disclaimer, { color: themeColors.textMuted }]}>
        Illustrative only. Past signal performance does not guarantee future returns.
      </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  hint: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  projections: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  projectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  projectionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 15,
  },
});
