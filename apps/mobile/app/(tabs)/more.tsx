import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { Link } from 'expo-router';

import { fetchMenuLinks, fetchSettings } from '@/lib/api';

import { RiskBanner } from '@/components/RiskBanner';

import { SettingsMenuList } from '@/components/SettingsMenuList';

import { QueryErrorView } from '@/components/QueryErrorView';

import { useAppStore } from '@/store/useAppStore';

import { radii, spacing } from '@/constants/theme';



export default function MoreScreen() {

  const themeColors = useAppStore((s) => s.colors);

  const isDarkMode = useAppStore((s) => s.isDarkMode);

  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);



  const menuQuery = useQuery({

    queryKey: ['menu'],

    queryFn: fetchMenuLinks,

  });



  const settingsQuery = useQuery({

    queryKey: ['settings'],

    queryFn: fetchSettings,

  });



  if (menuQuery.isLoading) {

    return (

      <View style={[styles.center, { backgroundColor: themeColors.background }]}>

        <ActivityIndicator color={themeColors.accent} size="large" />

      </View>

    );

  }



  if (menuQuery.isError) {

    return <QueryErrorView onRetry={() => menuQuery.refetch()} />;

  }



  const menuItems = menuQuery.data ?? [];



  return (

    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.content}>

      <RiskBanner disclaimer={settingsQuery.data?.disclaimer ?? ''} />



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

              <Text style={[styles.fallbackText, { color: themeColors.text }]}>Результаты</Text>

            </Pressable>

          </Link>

          <Link href="/rate-review" asChild>

            <Pressable style={[styles.fallbackLink, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>

              <Text style={[styles.fallbackText, { color: themeColors.text }]}>Оценить приложение</Text>

            </Pressable>

          </Link>

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


