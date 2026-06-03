import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MarketType } from '@qpulse/shared';
import { fetchHomeContent, fetchResults, fetchSettings } from '@/lib/api';
import { RiskBanner } from '@/components/RiskBanner';
import { TabScreen } from '@/components/TabScreen';
import { TelegramFab } from '@/components/TelegramFab';
import { QueryErrorView } from '@/components/QueryErrorView';
import { MarketMetricsSection } from '@/components/MarketMetricsSection';
import { DashboardResultsSummary } from '@/components/DashboardResultsSummary';
import { useAppStore } from '@/store/useAppStore';
import { radii, spacing } from '@/constants/theme';

export default function HomeScreen() {
  const themeColors = useAppStore((s) => s.colors);

  const homeQuery = useQuery({
    queryKey: ['home-content'],
    queryFn: fetchHomeContent,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const resultsQuery = useQuery({
    queryKey: ['results', MarketType.SPOT, '3M', 'dashboard'],
    queryFn: () => fetchResults(MarketType.SPOT, '3M'),
  });

  const isLoading = homeQuery.isLoading;

  const onRefresh = () => {
    void homeQuery.refetch();
    void resultsQuery.refetch();
  };

  if (isLoading) {
    return (
      <TabScreen style={{ backgroundColor: themeColors.background }}>
        <View style={styles.center}>
          <ActivityIndicator color={themeColors.accent} size="large" />
        </View>
      </TabScreen>
    );
  }

  if (homeQuery.isError) {
    const message =
      homeQuery.error instanceof Error ? homeQuery.error.message : 'Failed to load home content';
    return <QueryErrorView message={message} onRetry={() => homeQuery.refetch()} />;
  }

  const home = homeQuery.data!;
  const settings = settingsQuery.data;

  return (
    <TabScreen style={{ backgroundColor: themeColors.background }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={homeQuery.isRefetching || resultsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={themeColors.accent}
          />
        }
      >
        <RiskBanner disclaimer={settings?.disclaimer ?? ''} />

        {(home.socialLinks?.length ?? 0) > 0 && (
          <View style={styles.socialRow}>
            {home.socialLinks.map((link) => (
              <Pressable
                key={link.id}
                style={[
                  styles.socialButton,
                  { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                ]}
                onPress={() => Linking.openURL(link.url)}
              >
                <Ionicons name="paper-plane" size={18} color={themeColors.accent} />
                <Text style={[styles.socialText, { color: themeColors.text }]}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <MarketMetricsSection home={home} />

        <DashboardResultsSummary
          summary={resultsQuery.data?.summary}
          isLoading={resultsQuery.isLoading}
        />
      </ScrollView>

      <TelegramFab url={settings?.telegramFabUrl} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
