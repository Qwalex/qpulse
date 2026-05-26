import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { TIMEFRAME_API_MAP } from '@qpulse/shared';
import { colors, radii, spacing } from '@/constants/theme';

interface TimeframePillsProps {
  value: string;
  onChange: (timeframe: string) => void;
}

const TIMEFRAMES = Object.keys(TIMEFRAME_API_MAP);

export function TimeframePills({ value, onChange }: TimeframePillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TIMEFRAMES.map((tf) => {
        const active = value === tf;
        return (
          <Pressable
            key={tf}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(tf)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{tf}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.text,
  },
});
