import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface RiskBannerProps {
  disclaimer: string;
}

export function RiskBanner({ disclaimer }: RiskBannerProps) {
  const themeColors = useAppStore((s) => s.colors);

  if (!disclaimer) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: themeColors.warning + '18',
          borderColor: themeColors.warning + '44',
        },
      ]}
    >
      <Ionicons name="warning-outline" size={18} color={themeColors.warning} />
      <Text style={[styles.text, { color: themeColors.textSecondary }]}>{disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
