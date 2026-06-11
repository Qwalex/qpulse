import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PriceWatchStateDto, WatchlistCoinDto } from '@qpulse/shared';
import { radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface TrackedCoinsWidgetProps {
  watchlist: WatchlistCoinDto[];
  state?: PriceWatchStateDto;
}

function formatPrice(value: number): string {
  if (value <= 0) return '—';
  if (value >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  return value.toPrecision(4);
}

function findTicker(state: PriceWatchStateDto | undefined, coin: WatchlistCoinDto) {
  return state?.tickers.find(
    (t) => t.symbol === coin.symbol && t.marketType === coin.marketType,
  );
}

export function TrackedCoinsWidget({ watchlist, state }: TrackedCoinsWidgetProps) {
  const themeColors = useAppStore((s) => s.colors);

  if (watchlist.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name="eye-outline" size={18} color={themeColors.accent} />
        <Text style={[styles.title, { color: themeColors.text }]}>Tracked Coins</Text>
      </View>

      {watchlist.slice(0, 10).map((coin) => {
        const ticker = findTicker(state, coin);
        const price = ticker?.price ?? 0;
        const change = ticker?.change24hPct;
        const changeColor =
          change == null
            ? themeColors.textMuted
            : change >= 0
              ? themeColors.success
              : themeColors.danger;

        return (
          <View
            key={coin.id}
            style={[styles.row, { borderBottomColor: themeColors.cardBorder }]}
          >
            <View>
              <Text style={[styles.pair, { color: themeColors.text }]}>{coin.pairLabel}</Text>
              <Text style={[styles.market, { color: themeColors.textMuted }]}>
                {coin.marketType === 'FUTURES' ? 'Futures' : 'Spot'}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={[styles.price, { color: themeColors.text }]}>
                ${formatPrice(price)}
              </Text>
              {change != null && (
                <Text style={[styles.change, { color: changeColor }]}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  pair: {
    fontSize: 15,
    fontWeight: '700',
  },
  market: {
    fontSize: 11,
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
