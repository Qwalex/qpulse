import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '@/constants/theme';

const TELEGRAM_BLUE = '#2AABEE';
const TELEGRAM_BLUE_DARK = '#1E96D1';

interface JoinTelegramChannelCardProps {
  url: string;
}

export function JoinTelegramChannelCard({ url }: JoinTelegramChannelCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel="Join Telegram Channel"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="paper-plane" size={22} color="#FFFFFF" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Join Telegram Channel</Text>
        <Text style={styles.subtitle}>Signals, updates & community</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.9)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: TELEGRAM_BLUE,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: TELEGRAM_BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: TELEGRAM_BLUE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
