import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MarketType } from '@qpulse/shared';
import { colors, radii, spacing } from '@/constants/theme';

interface ResultsMarketToggleProps {
  value: MarketType;
  onChange: (market: MarketType) => void;
}

const OPTIONS: { key: MarketType; label: string }[] = [
  { key: MarketType.SPOT, label: 'Spot' },
  { key: MarketType.FUTURES, label: 'Futures' },
];

export function ResultsMarketToggle({ value, onChange }: ResultsMarketToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(option.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text,
  },
});
