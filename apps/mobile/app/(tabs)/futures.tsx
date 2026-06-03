import {

  ActivityIndicator,

  FlatList,

  Pressable,

  RefreshControl,

  StyleSheet,

  Text,

  View,

} from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { Link } from 'expo-router';

import { MarketType } from '@qpulse/shared';

import { fetchSignals, fetchSettings } from '@/lib/api';

import { SignalCard } from '@/components/SignalCard';

import { TelegramFab } from '@/components/TelegramFab';

import { QueryErrorView } from '@/components/QueryErrorView';
import { TabScreen } from '@/components/TabScreen';

import { useAppStore } from '@/store/useAppStore';

import { spacing } from '@/constants/theme';



export default function FuturesScreen() {

  const themeColors = useAppStore((s) => s.colors);



  const signalsQuery = useQuery({

    queryKey: ['signals', MarketType.FUTURES, 'live'],

    queryFn: () => fetchSignals(MarketType.FUTURES, 'live'),

  });



  const settingsQuery = useQuery({

    queryKey: ['settings'],

    queryFn: fetchSettings,

  });



  const signals = signalsQuery.data ?? [];



  if (signalsQuery.isLoading) {

    return (

      <TabScreen style={{ backgroundColor: themeColors.background }}>

        <View style={styles.center}>

        <ActivityIndicator color={themeColors.accent} size="large" />

        </View>

      </TabScreen>

    );

  }



  if (signalsQuery.isError) {
    const message =
      signalsQuery.error instanceof Error ? signalsQuery.error.message : 'Failed to load signals';
    return <QueryErrorView message={message} onRetry={() => signalsQuery.refetch()} />;
  }



  return (

    <TabScreen style={{ backgroundColor: themeColors.background }}>

      <View style={styles.header}>

        <Text style={[styles.title, { color: themeColors.text }]}>Futures ({signals.length})</Text>

        <Link href={{ pathname: '/results', params: { marketType: 'futures' } }} asChild>

          <Pressable style={[styles.resultsBtn, { backgroundColor: themeColors.accent }]}>

            <Text style={styles.resultsText}>Results</Text>

          </Pressable>

        </Link>

      </View>

      <FlatList

        data={signals}

        keyExtractor={(item) => item.id}

        refreshControl={

          <RefreshControl

            refreshing={signalsQuery.isRefetching}

            onRefresh={() => signalsQuery.refetch()}

            tintColor={themeColors.accent}

          />

        }

        renderItem={({ item }) => <SignalCard signal={item} />}

        contentContainerStyle={styles.listContent}

        ListEmptyComponent={

          <Text style={[styles.empty, { color: themeColors.textMuted }]}>No active signals</Text>

        }

      />

      <TelegramFab url={settingsQuery.data?.telegramFabUrl} />

    </TabScreen>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1 },

  center: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  header: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    paddingHorizontal: spacing.md,

    paddingTop: spacing.md,

  },

  title: { fontSize: 20, fontWeight: '700' },

  resultsBtn: {

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.xs,

    borderRadius: 8,

  },

  resultsText: { color: '#fff', fontWeight: '600' },

  listContent: { padding: spacing.md, paddingBottom: 100 },

  empty: { textAlign: 'center', marginVertical: spacing.md },

});


