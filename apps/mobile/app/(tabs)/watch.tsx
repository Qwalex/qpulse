import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { MarketType, PriceAlertCondition } from '@qpulse/shared';
import {
  addWatchlistCoin,
  createPriceAlert,
  deletePriceAlert,
  removeWatchlistCoin,
} from '@/lib/api';
import { TabScreen } from '@/components/TabScreen';
import { useDevicePriceWatch } from '@/hooks/useDevicePriceWatch';
import { useAppStore } from '@/store/useAppStore';
import { radii, spacing } from '@/constants/theme';

const CONDITIONS: PriceAlertCondition[] = [
  PriceAlertCondition.ABOVE,
  PriceAlertCondition.BELOW,
  PriceAlertCondition.AT,
];

function conditionLabel(condition: PriceAlertCondition): string {
  if (condition === PriceAlertCondition.ABOVE) return 'Above';
  if (condition === PriceAlertCondition.BELOW) return 'Below';
  return 'At';
}

export default function WatchScreen() {
  const themeColors = useAppStore((s) => s.colors);
  const queryClient = useQueryClient();
  const { deviceId, priceWatchQuery } = useDevicePriceWatch();

  const [pairInput, setPairInput] = useState('BTC/USDT');
  const [marketType, setMarketType] = useState<MarketType>(MarketType.FUTURES);
  const [alertPair, setAlertPair] = useState('ETH/USDT');
  const [alertMarket, setAlertMarket] = useState<MarketType>(MarketType.FUTURES);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertCondition, setAlertCondition] = useState<PriceAlertCondition>(
    PriceAlertCondition.ABOVE,
  );

  const invalidate = () => {
    if (deviceId) {
      void queryClient.invalidateQueries({ queryKey: ['price-watch', deviceId] });
    }
  };

  const addWatchMutation = useMutation({
    mutationFn: () => addWatchlistCoin(deviceId!, pairInput, marketType),
    onSuccess: invalidate,
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const removeWatchMutation = useMutation({
    mutationFn: (id: string) => removeWatchlistCoin(id, deviceId!),
    onSuccess: invalidate,
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const addAlertMutation = useMutation({
    mutationFn: () => {
      const targetPrice = Number(alertPrice.replace(',', '.'));
      return createPriceAlert(deviceId!, alertPair, alertMarket, targetPrice, alertCondition);
    },
    onSuccess: () => {
      setAlertPrice('');
      invalidate();
    },
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const removeAlertMutation = useMutation({
    mutationFn: (id: string) => deletePriceAlert(id, deviceId!),
    onSuccess: invalidate,
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  const state = priceWatchQuery.data;
  const isLoading = priceWatchQuery.isLoading;

  return (
    <TabScreen style={{ backgroundColor: themeColors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={priceWatchQuery.isRefetching}
            onRefresh={() => priceWatchQuery.refetch()}
            tintColor={themeColors.accent}
          />
        }
      >
        <Text style={[styles.pageTitle, { color: themeColors.text }]}>Price Watch</Text>

        <View
          style={[
            styles.section,
            { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Watchlist (max 10)</Text>
          <TextInput
            style={[
              styles.input,
              { color: themeColors.text, borderColor: themeColors.cardBorder },
            ]}
            value={pairInput}
            onChangeText={setPairInput}
            placeholder="BTC/USDT"
            placeholderTextColor={themeColors.textMuted}
            autoCapitalize="characters"
          />
          <View style={styles.marketRow}>
            {[MarketType.FUTURES, MarketType.SPOT].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.marketPill,
                  {
                    backgroundColor:
                      marketType === type ? themeColors.accent : themeColors.background,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
                onPress={() => setMarketType(type)}
              >
                <Text
                  style={{
                    color: marketType === type ? themeColors.textOnAccent : themeColors.text,
                    fontWeight: '600',
                  }}
                >
                  {type === MarketType.FUTURES ? 'Futures' : 'Spot'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: themeColors.accent }]}
            onPress={() => addWatchMutation.mutate()}
            disabled={!deviceId || addWatchMutation.isPending}
          >
            <Text style={[styles.primaryBtnText, { color: themeColors.textOnAccent }]}>
              Add to watchlist
            </Text>
          </Pressable>

          {isLoading ? (
            <ActivityIndicator color={themeColors.accent} style={styles.loader} />
          ) : (
            state?.watchlist.map((coin) => {
              const ticker = state.tickers.find(
                (t) => t.symbol === coin.symbol && t.marketType === coin.marketType,
              );
              return (
                <View
                  key={coin.id}
                  style={[styles.listRow, { borderTopColor: themeColors.cardBorder }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: themeColors.text }]}>
                      {coin.pairLabel}
                    </Text>
                    <Text style={[styles.rowSub, { color: themeColors.textMuted }]}>
                      {coin.marketType} · ${ticker?.price?.toLocaleString() ?? '—'}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeWatchMutation.mutate(coin.id)}>
                    <Ionicons name="trash-outline" size={20} color={themeColors.danger} />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Price Alerts</Text>
          <TextInput
            style={[
              styles.input,
              { color: themeColors.text, borderColor: themeColors.cardBorder },
            ]}
            value={alertPair}
            onChangeText={setAlertPair}
            placeholder="Pair"
            placeholderTextColor={themeColors.textMuted}
            autoCapitalize="characters"
          />
          <TextInput
            style={[
              styles.input,
              { color: themeColors.text, borderColor: themeColors.cardBorder },
            ]}
            value={alertPrice}
            onChangeText={setAlertPrice}
            placeholder="Target price"
            placeholderTextColor={themeColors.textMuted}
            keyboardType="decimal-pad"
          />
          <View style={styles.marketRow}>
            {CONDITIONS.map((condition) => (
              <Pressable
                key={condition}
                style={[
                  styles.condPill,
                  {
                    backgroundColor:
                      alertCondition === condition ? themeColors.accent : themeColors.background,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
                onPress={() => setAlertCondition(condition)}
              >
                <Text
                  style={{
                    color:
                      alertCondition === condition ? themeColors.textOnAccent : themeColors.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {conditionLabel(condition)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.marketRow}>
            {[MarketType.FUTURES, MarketType.SPOT].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.marketPill,
                  {
                    backgroundColor:
                      alertMarket === type ? themeColors.accent : themeColors.background,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
                onPress={() => setAlertMarket(type)}
              >
                <Text
                  style={{
                    color: alertMarket === type ? themeColors.textOnAccent : themeColors.text,
                    fontWeight: '600',
                  }}
                >
                  {type === MarketType.FUTURES ? 'Futures' : 'Spot'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: themeColors.accent }]}
            onPress={() => addAlertMutation.mutate()}
            disabled={!deviceId || addAlertMutation.isPending}
          >
            <Text style={[styles.primaryBtnText, { color: themeColors.textOnAccent }]}>
              Create alert
            </Text>
          </Pressable>

          {state?.alerts.map((alert) => (
            <View
              key={alert.id}
              style={[styles.listRow, { borderTopColor: themeColors.cardBorder }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: themeColors.text }]}>
                  {alert.pairLabel}
                </Text>
                <Text style={[styles.rowSub, { color: themeColors.textMuted }]}>
                  {conditionLabel(alert.condition)} {alert.targetPrice} · {alert.source}
                </Text>
              </View>
              <Pressable onPress={() => removeAlertMutation.mutate(alert.id)}>
                <Ionicons name="close-circle-outline" size={22} color={themeColors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 15,
  },
  marketRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  marketPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  condPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  primaryBtn: {
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  loader: {
    marginVertical: spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
