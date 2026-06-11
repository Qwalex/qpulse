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
import {
  fetchHomeContent,
  fetchMarketMetrics,
  fetchResults,
  fetchSettings,
  homeContentToMarketMetrics,
} from '@/lib/api';
import { RiskBanner } from '@/components/RiskBanner';
import { TabScreen } from '@/components/TabScreen';
import { JoinTelegramChannelCard } from '@/components/JoinTelegramChannelCard';
import { QueryErrorView } from '@/components/QueryErrorView';
import { MarketMetricsSection } from '@/components/MarketMetricsSection';
import { DashboardResultsSummary } from '@/components/DashboardResultsSummary';
import { useAppStore } from '@/store/useAppStore';
import { radii, spacing } from '@/constants/theme';

function isTelegramLink(link: { id: string; url: string; icon: string }): boolean {
  return (
    link.icon === 'telegram' ||
    link.id === 'telegram' ||
    link.id === 'tg' ||
    link.url.includes('t.me/')
  );
}

export default function HomeScreen() {
  const themeColors = useAppStore((s) => s.colors);

  const homeQuery = useQuery({
    queryKey: ['home-content'],
    queryFn: fetchHomeContent,
  });

  const metricsQuery = useQuery({
    queryKey: ['market-metrics'],
    queryFn: fetchMarketMetrics,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const futuresResultsQuery = useQuery({
    queryKey: ['results', MarketType.FUTURES, '3M', 'dashboard'],
    queryFn: () => fetchResults(MarketType.FUTURES, '3M'),
  });

  const spotResultsQuery = useQuery({
    queryKey: ['results', MarketType.SPOT, '3M', 'dashboard'],
    queryFn: () => fetchResults(MarketType.SPOT, '3M'),
  });

  const isLoading = homeQuery.isLoading;
  const resultsLoading = futuresResultsQuery.isLoading || spotResultsQuery.isLoading;

  const onRefresh = () => {
    void homeQuery.refetch();
    void metricsQuery.refetch();
    void futuresResultsQuery.refetch();
    void spotResultsQuery.refetch();
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
  const metrics = metricsQuery.isSuccess
    ? metricsQuery.data
    : metricsQuery.isError
      ? homeContentToMarketMetrics(home)
      : undefined;

  const telegramFromSocial = home.socialLinks?.find(isTelegramLink);
  const telegramUrl = telegramFromSocial?.url ?? settings?.telegramFabUrl ?? null;
  const otherSocialLinks = (home.socialLinks ?? []).filter((link) => !isTelegramLink(link));

  return (
    <TabScreen style={{ backgroundColor: themeColors.background }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={
              homeQuery.isRefetching ||
              metricsQuery.isRefetching ||
              futuresResultsQuery.isRefetching ||
              spotResultsQuery.isRefetching
            }
            onRefresh={onRefresh}
            tintColor={themeColors.accent}
          />
        }
      >
        <RiskBanner disclaimer={settings?.disclaimer ?? ''} />

        {telegramUrl ? <JoinTelegramChannelCard url={telegramUrl} /> : null}

        {otherSocialLinks.length > 0 && (
          <View style={styles.socialRow}>
            {otherSocialLinks.map((link) => (
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

        {metrics ? (
          <MarketMetricsSection metrics={metrics} />
        ) : metricsQuery.isLoading ? (
          <ActivityIndicator color={themeColors.accent} style={styles.metricsLoader} />
        ) : null}

        <DashboardResultsSummary
          futuresSummary={futuresResultsQuery.data?.summary}
          spotSummary={spotResultsQuery.data?.summary}
          isLoading={resultsLoading}
        />
      </ScrollView>

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
  metricsLoader: {
    marginVertical: spacing.lg,
  },
});
