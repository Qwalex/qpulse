import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import type { MenuLinkDto } from '@qpulse/shared';
import { MenuActionType } from '@qpulse/shared';
import { fetchMenuLinks } from '@/lib/api';
import { useDeviceReview } from '@/hooks/useDeviceReview';

import { SettingsMenuList } from '@/components/SettingsMenuList';

import { QueryErrorView } from '@/components/QueryErrorView';
import { TabScreen } from '@/components/TabScreen';

import { useAppStore } from '@/store/useAppStore';

import { radii, spacing } from '@/constants/theme';



export default function MoreScreen() {

  const themeColors = useAppStore((s) => s.colors);

  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const notificationsHydrated = useAppStore((s) => s.notificationsHydrated);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const { ready: reviewReady, hasReview } = useDeviceReview();

  const onNotificationsToggle = async (value: boolean) => {
    setNotificationsBusy(true);
    try {
      const registered = await setNotificationsEnabled(value);
      if (value && !registered) {
        Alert.alert(
          'Permission required',
          'Allow notifications in system settings to receive signal and price alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => void Linking.openSettings() },
          ],
        );
      }
    } finally {
      setNotificationsBusy(false);
    }
  };

  const menuQuery = useQuery({

    queryKey: ['menu'],

    queryFn: fetchMenuLinks,

  });

  const menuItems = useMemo((): MenuLinkDto[] => {
    const items = menuQuery.data ?? [];
    return items.flatMap((item) => {
      if (item.id !== 'rate_review') return [item];
      if (!reviewReady || !hasReview) return [item];
      return [
        {
          ...item,
          label: 'Edit review',
          route: '/rate-review',
          actionType: MenuActionType.INTERNAL_ROUTE,
        },
      ];
    });
  }, [menuQuery.data, reviewReady, hasReview]);

  if (menuQuery.isLoading) {

    return (

      <TabScreen style={{ backgroundColor: themeColors.background }}>

        <View style={styles.center}>

        <ActivityIndicator color={themeColors.accent} size="large" />

        </View>

      </TabScreen>

    );

  }



  if (menuQuery.isError) {
    const message =
      menuQuery.error instanceof Error ? menuQuery.error.message : 'Failed to load menu';
    return <QueryErrorView message={message} onRetry={() => menuQuery.refetch()} />;
  }

  return (

    <TabScreen style={{ backgroundColor: themeColors.background }}>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      <View style={[styles.settingsRow, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
        <View style={styles.settingsRowText}>
          <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Notifications</Text>
          <Text style={[styles.settingsHint, { color: themeColors.textMuted }]}>
            Signal updates and price alerts
          </Text>
        </View>
        {!notificationsHydrated || notificationsBusy ? (
          <ActivityIndicator color={themeColors.accent} />
        ) : (
          <Switch
            value={notificationsEnabled}
            onValueChange={(value) => void onNotificationsToggle(value)}
            trackColor={{ false: themeColors.cardBorder, true: themeColors.accentMuted }}
            thumbColor={notificationsEnabled ? themeColors.accent : '#f4f3f4'}
          />
        )}
      </View>

      <View style={[styles.settingsRow, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
        <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Dark Mode</Text>

        <Switch

          value={isDarkMode}

          onValueChange={() => toggleDarkMode()}

          trackColor={{ false: themeColors.cardBorder, true: themeColors.accentMuted }}

          thumbColor={isDarkMode ? themeColors.accent : '#f4f3f4'}

        />

      </View>



      {menuItems.length > 0 ? (

        <SettingsMenuList items={menuItems} />

      ) : (

        <View style={styles.fallback}>

          <Link href="/results" asChild>

            <Pressable style={[styles.fallbackLink, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>

              <Text style={[styles.fallbackText, { color: themeColors.text }]}>Results</Text>

            </Pressable>

          </Link>

          {!hasReview ? (
            <Link href="/rate-review" asChild>
              <Pressable
                style={[styles.fallbackLink, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
              >
                <Text style={[styles.fallbackText, { color: themeColors.text }]}>Rate app</Text>
              </Pressable>
            </Link>
          ) : (
            <Link href="/rate-review" asChild>
              <Pressable
                style={[styles.fallbackLink, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
              >
                <Text style={[styles.fallbackText, { color: themeColors.text }]}>Edit review</Text>
              </Pressable>
            </Link>
          )}

        </View>

      )}

    </ScrollView>

    </TabScreen>

  );

}



const styles = StyleSheet.create({

  scroll: {

    flex: 1,

  },

  content: {

    padding: spacing.md,

  },

  center: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  settingsRowText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsHint: {
    fontSize: 13,
    marginTop: 4,
  },

  fallback: {

    gap: spacing.sm,

  },

  fallbackLink: {

    borderRadius: radii.md,

    padding: spacing.md,

    borderWidth: 1,

  },

  fallbackText: {

    fontSize: 16,

    fontWeight: '600',

  },

});


