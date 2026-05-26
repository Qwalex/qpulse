import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/constants/theme';

interface RiskBannerProps {
  disclaimer: string;
}

export function RiskBanner({ disclaimer }: RiskBannerProps) {
  if (!disclaimer) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="warning-outline" size={18} color={colors.warning} />
      <Text style={styles.text}>{disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warning + '18',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  text: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
