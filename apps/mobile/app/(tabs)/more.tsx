import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import type { MenuLinkDto } from '@qpulse/shared';
import { MenuActionType } from '@qpulse/shared';
import { fetchMenuLinks } from '@/lib/api';
import { useDeviceReview } from '@/hooks/useDeviceReview';

import { SettingsMenuList } from '@/components/SettingsMenuList';

import { QueryErrorView } from '@/components/QueryErrorView';

import { useAppStore } from '@/store/useAppStore';

import { radii, spacing } from '@/constants/theme';



export default function MoreScreen() {

  const themeColors = useAppStore((s) => s.colors);

  const isDarkMode = useAppStore((s) => s.isDarkMode);

  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const { ready: reviewReady, hasReview } = useDeviceReview();

  const menuQuery = useQuery({

    queryKey: ['menu'],

    queryFn: fetchMenuLinks,

  });



  if (menuQuery.isLoading) {

    return (

      <View style={[styles.center, { backgroundColor: themeColors.background }]}>

        <ActivityIndicator color={themeColors.accent} size="large" />

      </View>

    );

  }



  if (menuQuery.isError) {
    const message =
      menuQuery.error instanceof Error ? menuQuery.error.message : 'Failed to load menu';
    return <QueryErrorView message={message} onRetry={() => menuQuery.refetch()} />;
  }



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

  return (

    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.content}>

      <View style={[styles.darkModeRow, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>

        <Text style={[styles.darkModeLabel, { color: themeColors.text }]}>Dark Mode</Text>

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

  );

}



const styles = StyleSheet.create({

  container: {

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

  darkModeRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    borderRadius: radii.md,

    borderWidth: 1,

    padding: spacing.md,

    marginBottom: spacing.md,

  },

  darkModeLabel: {

    fontSize: 16,

    fontWeight: '600',

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


