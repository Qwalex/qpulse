import {

  ActivityIndicator,

  FlatList,

  Linking,

  Pressable,

  RefreshControl,

  StyleSheet,

  Text,

  View,

} from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { Link } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { fetchHomeContent, fetchSettings } from '@/lib/api';

import { RiskBanner } from '@/components/RiskBanner';

import { TelegramFab } from '@/components/TelegramFab';

import { QueryErrorView } from '@/components/QueryErrorView';

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



  if (homeQuery.isLoading) {

    return (

      <View style={[styles.center, { backgroundColor: themeColors.background }]}>

        <ActivityIndicator color={themeColors.accent} size="large" />

      </View>

    );

  }



  if (homeQuery.isError) {

    return <QueryErrorView onRetry={() => homeQuery.refetch()} />;

  }



  const home = homeQuery.data;

  const settings = settingsQuery.data;



  return (

    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      <FlatList

        data={home?.ticker ?? []}

        keyExtractor={(item) => item.pair}

        refreshControl={

          <RefreshControl

            refreshing={homeQuery.isRefetching}

            onRefresh={() => homeQuery.refetch()}

            tintColor={themeColors.accent}

          />

        }

        ListHeaderComponent={

          <>

            <RiskBanner disclaimer={settings?.disclaimer ?? ''} />



            {(home?.socialLinks?.length ?? 0) > 0 && (

              <View style={styles.socialRow}>

                {home!.socialLinks.map((link) => (

                  <Pressable

                    key={link.id}

                    style={[styles.socialButton, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}

                    onPress={() => Linking.openURL(link.url)}

                  >

                    <Ionicons name="paper-plane" size={18} color={themeColors.accent} />

                    <Text style={[styles.socialText, { color: themeColors.text }]}>{link.label}</Text>

                  </Pressable>

                ))}

              </View>

            )}



            <View style={[styles.btcCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>

              <Text style={[styles.btcLabel, { color: themeColors.textSecondary }]}>Bitcoin</Text>

              <Text style={[styles.btcPrice, { color: themeColors.text }]}>

                ${home?.btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '—'}

              </Text>

              <Text

                style={[

                  styles.btcChange,

                  { color: (home?.btcChange24h ?? 0) >= 0 ? themeColors.success : themeColors.danger },

                ]}

              >

                {(home?.btcChange24h ?? 0) >= 0 ? '+' : ''}

                {home?.btcChange24h?.toFixed(2) ?? '0'}% (24h)

              </Text>

              <View style={styles.btcMeta}>

                <Text style={[styles.metaText, { color: themeColors.textMuted }]}>Cap: {home?.btcMarketCap ?? '—'}</Text>

                <Text style={[styles.metaText, { color: themeColors.textMuted }]}>Vol: {home?.btcVolume ?? '—'}</Text>

              </View>

            </View>



            <View style={[styles.fearCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>

              <Text style={[styles.fearLabel, { color: themeColors.textSecondary }]}>Fear & Greed</Text>

              <Text style={[styles.fearValue, { color: themeColors.accent }]}>{home?.fearGreedValue ?? '—'}</Text>

              <Text style={[styles.fearDesc, { color: themeColors.text }]}>{home?.fearGreedLabel ?? ''}</Text>

            </View>



            <View style={styles.linksRow}>

              <Link href="/results" style={[styles.linkButton, { backgroundColor: themeColors.accent }]}>

                <Text style={[styles.linkText, { color: themeColors.text }]}>Результаты</Text>

              </Link>

            </View>



            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Ticker</Text>

          </>

        }

        renderItem={({ item }) => (

          <View style={[styles.tickerRow, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>

            <Text style={[styles.tickerPair, { color: themeColors.text }]}>{item.pair}</Text>

            <Text style={[styles.tickerPrice, { color: themeColors.textSecondary }]}>{item.price.toLocaleString()}</Text>

            <Text

              style={[

                styles.tickerChange,

                { color: item.change >= 0 ? themeColors.success : themeColors.danger },

              ]}

            >

              {item.change >= 0 ? '+' : ''}

              {item.change.toFixed(2)}%

            </Text>

          </View>

        )}

        contentContainerStyle={styles.listContent}

      />

      <TelegramFab url={settings?.telegramFabUrl} />

    </View>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

  },

  center: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  listContent: {

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

  btcCard: {

    borderRadius: radii.md,

    padding: spacing.md,

    marginBottom: spacing.md,

    borderWidth: 1,

  },

  btcLabel: {

    fontSize: 13,

  },

  btcPrice: {

    fontSize: 32,

    fontWeight: '700',

    marginTop: 4,

  },

  btcChange: {

    fontSize: 16,

    fontWeight: '600',

    marginTop: 4,

  },

  btcMeta: {

    flexDirection: 'row',

    gap: spacing.md,

    marginTop: spacing.sm,

  },

  metaText: {

    fontSize: 12,

  },

  fearCard: {

    borderRadius: radii.md,

    padding: spacing.md,

    marginBottom: spacing.md,

    alignItems: 'center',

    borderWidth: 1,

  },

  fearLabel: {

    fontSize: 13,

  },

  fearValue: {

    fontSize: 40,

    fontWeight: '700',

  },

  fearDesc: {

    fontSize: 14,

    marginTop: 4,

  },

  linksRow: {

    flexDirection: 'row',

    marginBottom: spacing.md,

  },

  linkButton: {

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    borderRadius: radii.sm,

  },

  linkText: {

    fontWeight: '600',

  },

  sectionTitle: {

    fontSize: 16,

    fontWeight: '700',

    marginBottom: spacing.sm,

  },

  tickerRow: {

    flexDirection: 'row',

    alignItems: 'center',

    borderRadius: radii.sm,

    padding: spacing.sm,

    marginBottom: spacing.xs,

    borderWidth: 1,

  },

  tickerPair: {

    flex: 1,

    fontWeight: '600',

  },

  tickerPrice: {

    marginRight: spacing.sm,

  },

  tickerChange: {

    fontWeight: '600',

    minWidth: 70,

    textAlign: 'right',

  },

});


