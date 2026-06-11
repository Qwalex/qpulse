import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { TIMEFRAME_API_MAP } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface TimeframePillsProps {
  value: string;
  onChange: (timeframe: string) => void;
}

const TIMEFRAMES = Object.keys(TIMEFRAME_API_MAP);

export function TimeframePills({ value, onChange }: TimeframePillsProps) {
  const themeColors = useAppStore((s) => s.colors);

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
            style={[
              styles.pill,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.cardBorder,
              },
              active && {
                backgroundColor: themeColors.accent,
                borderColor: themeColors.accent,
              },
            ]}
            onPress={() => onChange(tf)}
          >
            <Text
              style={[
                styles.pillText,
                { color: themeColors.textSecondary },
                active && { color: themeColors.textOnAccent },
              ]}
            >
              {tf}
            </Text>
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
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
