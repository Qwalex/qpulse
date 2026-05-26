import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { MenuLinkDto } from '@qpulse/shared';
import { MenuActionType } from '@qpulse/shared';
import { colors, radii, spacing } from '@/constants/theme';

interface SettingsMenuListProps {
  items: MenuLinkDto[];
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  results: 'stats-chart-outline',
  review: 'star-outline',
  telegram: 'paper-plane-outline',
  link: 'link-outline',
  settings: 'settings-outline',
};

function resolveIcon(icon: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[icon.toLowerCase()] ?? 'chevron-forward-outline';
}

export function SettingsMenuList({ items }: SettingsMenuListProps) {
  const router = useRouter();

  const handlePress = (item: MenuLinkDto) => {
    if (item.actionType === MenuActionType.EXTERNAL_LINK && item.url) {
      Linking.openURL(item.url);
      return;
    }
    if (item.actionType === MenuActionType.INTERNAL_ROUTE && item.route) {
      router.push(item.route as never);
    }
  };

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.row}
          onPress={() => handlePress(item)}
          accessibilityRole="button"
        >
          <View style={styles.iconWrap}>
            <Ionicons name={resolveIcon(item.icon)} size={20} color={colors.accent} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
});
