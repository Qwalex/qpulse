import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { MenuLinkDto } from '@qpulse/shared';
import { MenuActionType } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

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
  const themeColors = useAppStore((s) => s.colors);

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
    <View
      style={[
        styles.list,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          style={[
            styles.row,
            { borderBottomColor: themeColors.cardBorder },
            index === items.length - 1 && styles.rowLast,
          ]}
          onPress={() => handlePress(item)}
          accessibilityRole="button"
        >
          <View style={[styles.iconWrap, { backgroundColor: themeColors.accent + '22' }]}>
            <Ionicons name={resolveIcon(item.icon)} size={20} color={themeColors.accent} />
          </View>
          <Text style={[styles.label, { color: themeColors.text }]}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
});
