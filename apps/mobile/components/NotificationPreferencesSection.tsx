import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DeviceNotificationPreferenceKey } from '@qpulse/shared';
import { fetchNotificationPreferences, updateNotificationPreferences } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';
import { useAppStore } from '@/store/useAppStore';
import { radii, spacing } from '@/constants/theme';

interface PreferenceItem {
  key: DeviceNotificationPreferenceKey;
  label: string;
  hint?: string;
}

interface PreferenceGroup {
  title: string;
  items: PreferenceItem[];
}

const PREFERENCE_GROUPS: PreferenceGroup[] = [
  {
    title: 'Signals',
    items: [
      { key: 'signalsNew', label: 'New signals', hint: 'When a new trade idea is published' },
      { key: 'signalsTp', label: 'Take profit', hint: 'TP level reached' },
      { key: 'signalsSl', label: 'Stop loss', hint: 'SL reached' },
      { key: 'signalsLiquidation', label: 'Liquidation', hint: 'Position liquidated' },
      { key: 'signalsClosed', label: 'Signal closed', hint: 'Trade closed with result' },
      {
        key: 'signalsUpdates',
        label: 'Other updates',
        hint: 'Entry changes, status updates',
      },
    ],
  },
  {
    title: 'Watch',
    items: [{ key: 'priceAlerts', label: 'Price alerts', hint: 'Watch tab and entry price hits' }],
  },
  {
    title: 'Markets',
    items: [
      { key: 'spotEnabled', label: 'Spot signals' },
      { key: 'futuresEnabled', label: 'Futures signals' },
    ],
  },
];

interface NotificationPreferencesSectionProps {
  masterEnabled: boolean;
}

export function NotificationPreferencesSection({ masterEnabled }: NotificationPreferencesSectionProps) {
  const themeColors = useAppStore((s) => s.colors);
  const queryClient = useQueryClient();
  const [busyKey, setBusyKey] = useState<DeviceNotificationPreferenceKey | null>(null);

  const prefsQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      return fetchNotificationPreferences(deviceId);
    },
    enabled: masterEnabled,
  });

  const onToggle = async (key: DeviceNotificationPreferenceKey, value: boolean) => {
    setBusyKey(key);
    try {
      const deviceId = await getDeviceId();
      const updated = await updateNotificationPreferences(deviceId, { [key]: value });
      queryClient.setQueryData(['notification-preferences'], updated);
    } finally {
      setBusyKey(null);
    }
  };

  if (!masterEnabled) {
    return null;
  }

  if (prefsQuery.isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
        <ActivityIndicator color={themeColors.accent} />
      </View>
    );
  }

  if (prefsQuery.isError) {
    const message =
      prefsQuery.error instanceof Error ? prefsQuery.error.message : 'Failed to load notification settings';
    return (
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
        <Text style={[styles.rowHint, { color: themeColors.textMuted }]}>{message}</Text>
        <Pressable onPress={() => void prefsQuery.refetch()} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: themeColors.accent }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const prefs = prefsQuery.data;
  if (!prefs) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>Notification types</Text>
      {PREFERENCE_GROUPS.map((group) => (
        <View
          key={group.title}
          style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
        >
          <Text style={[styles.groupTitle, { color: themeColors.text }]}>{group.title}</Text>
          {group.items.map((item, index) => {
            const isLast = index === group.items.length - 1;
            const value = prefs[item.key];
            const isBusy = busyKey === item.key;

            return (
              <View
                key={item.key}
                style={[
                  styles.row,
                  !isLast && { borderBottomColor: themeColors.cardBorder, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: themeColors.text }]}>{item.label}</Text>
                  {item.hint ? (
                    <Text style={[styles.rowHint, { color: themeColors.textMuted }]}>{item.hint}</Text>
                  ) : null}
                </View>
                {isBusy ? (
                  <ActivityIndicator color={themeColors.accent} />
                ) : (
                  <Switch
                    value={value}
                    onValueChange={(next) => void onToggle(item.key, next)}
                    trackColor={{ false: themeColors.cardBorder, true: themeColors.accentMuted }}
                    thumbColor={value ? themeColors.accent : '#f4f3f4'}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowHint: {
    fontSize: 12,
    marginTop: 2,
  },
  retryButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
