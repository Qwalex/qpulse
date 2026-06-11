import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '@/constants/theme';
import { markNotificationsPromptShown, shouldShowNotificationsPrompt } from '@/lib/notificationPreferences';
import { useAppStore } from '@/store/useAppStore';

export function NotificationsEnablePromptModal() {
  const themeColors = useAppStore((s) => s.colors);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const notificationsHydrated = useAppStore((s) => s.notificationsHydrated);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);

  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (!notificationsHydrated || notificationsEnabled) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const shouldShow = await shouldShowNotificationsPrompt();
      if (!cancelled && shouldShow) {
        setVisible(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notificationsEnabled, notificationsHydrated]);

  const dismiss = useCallback(async () => {
    await markNotificationsPromptShown();
    setVisible(false);
  }, []);

  const enableNotifications = useCallback(async () => {
    setEnabling(true);
    try {
      await setNotificationsEnabled(true);
      await markNotificationsPromptShown();
      setVisible(false);
    } finally {
      setEnabling(false);
    }
  }, [setNotificationsEnabled]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => void dismiss()}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
          <View style={[styles.iconWrap, { backgroundColor: themeColors.accentMuted }]}>
            <Ionicons name="notifications-outline" size={28} color={themeColors.textOnAccent} />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>Enable notifications?</Text>
          <Text style={[styles.body, { color: themeColors.textSecondary }]}>
            Get alerts for new signals, take profit, stop loss, and price watch triggers.
          </Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: themeColors.accent }]}
            onPress={() => void enableNotifications()}
            disabled={enabling}
          >
            {enabling ? (
              <ActivityIndicator color={themeColors.textOnAccent} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: themeColors.textOnAccent }]}>
                Enable notifications
              </Text>
            )}
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void dismiss()} disabled={enabling}>
            <Text style={[styles.secondaryButtonText, { color: themeColors.textMuted }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryButton: {
    width: '100%',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
