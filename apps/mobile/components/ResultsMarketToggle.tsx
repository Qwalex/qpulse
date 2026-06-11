import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MarketType } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface ResultsMarketToggleProps {
  value: MarketType;
  onChange: (market: MarketType) => void;
}

const OPTIONS: { key: MarketType; label: string }[] = [
  { key: MarketType.FUTURES, label: 'Futures' },
  { key: MarketType.SPOT, label: 'Spot' },
];

export function ResultsMarketToggle({ value, onChange }: ResultsMarketToggleProps) {
  const themeColors = useAppStore((s) => s.colors);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      {OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            style={[styles.tab, active && { backgroundColor: themeColors.accent }]}
            onPress={() => onChange(option.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: themeColors.textSecondary },
                active && { color: themeColors.textOnAccent },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
