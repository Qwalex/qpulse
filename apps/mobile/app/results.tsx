import { useEffect, useState } from 'react';

import {

  ActivityIndicator,

  FlatList,

  RefreshControl,

  StyleSheet,

  View,

} from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { useQuery } from '@tanstack/react-query';

import { MarketType } from '@qpulse/shared';

import { fetchResults } from '@/lib/api';

import { useAppStore } from '@/store/useAppStore';

import { SummaryStatsCard } from '@/components/SummaryStatsCard';

import { ClosedSignalCard } from '@/components/ClosedSignalCard';

import { ResultsMarketToggle } from '@/components/ResultsMarketToggle';

import { TimeframePills } from '@/components/TimeframePills';

import { QueryErrorView } from '@/components/QueryErrorView';

import { spacing } from '@/constants/theme';



function parseMarketType(value: string | string[] | undefined): MarketType {

  const raw = Array.isArray(value) ? value[0] : value;

  return raw === 'futures' ? MarketType.FUTURES : MarketType.SPOT;

}



export default function ResultsScreen() {

  const params = useLocalSearchParams<{ marketType?: string }>();

  const market = useAppStore((s) => s.resultsMarket);

  const setMarket = useAppStore((s) => s.setResultsMarket);

  const themeColors = useAppStore((s) => s.colors);

  const [timeframe, setTimeframe] = useState('3M');



  useEffect(() => {

    setMarket(parseMarketType(params.marketType));

  }, [params.marketType, setMarket]);



  const resultsQuery = useQuery({

    queryKey: ['results', market, timeframe],

    queryFn: () => fetchResults(market, timeframe),

  });



  if (resultsQuery.isLoading) {

    return (

      <View style={[styles.center, { backgroundColor: themeColors.background }]}>

        <ActivityIndicator color={themeColors.accent} size="large" />

      </View>

    );

  }



  if (resultsQuery.isError) {

    return <QueryErrorView onRetry={() => resultsQuery.refetch()} />;

  }



  const data = resultsQuery.data;



  return (

    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      <FlatList

        data={data?.signals ?? []}

        keyExtractor={(item) => item.id}

        refreshControl={

          <RefreshControl

            refreshing={resultsQuery.isRefetching}

            onRefresh={() => resultsQuery.refetch()}

            tintColor={themeColors.accent}

          />

        }

        ListHeaderComponent={

          <>

            <ResultsMarketToggle value={market} onChange={setMarket} />

            <TimeframePills value={timeframe} onChange={setTimeframe} />

            {data?.summary && <SummaryStatsCard summary={data.summary} />}

          </>

        }

        renderItem={({ item }) => <ClosedSignalCard signal={item} />}

        contentContainerStyle={styles.listContent}

      />

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

  },

});

