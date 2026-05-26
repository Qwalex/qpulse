import { Linking, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '@/constants/theme';

interface TelegramFabProps {
  url?: string | null;
}

export function TelegramFab({ url }: TelegramFabProps) {
  if (!url) return null;

  return (
    <Pressable
      style={styles.fab}
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel="Telegram"
    >
      <Ionicons name="paper-plane" size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
