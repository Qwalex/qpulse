import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MarketMetricsDto } from '@qpulse/shared';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import {
  altcoinSeasonLabel,
  compute90dChangeFromPrices,
  computeAltcoinSeasonFrom30dMarkets,
  downsampleMarketCapChart,
  formatBtcPrice,
  formatMarketCapUsd,
  formatUsdCompact,
  mapHomeContentToMetrics,
  scaleBtcMarketCapChart,
} from './market-metrics.mapper';

const CACHE_KEY = 'qpulse:market-metrics:v6';
const CACHE_TTL_SEC = 600;
const STALE_TTL_SEC = 86_400;
const ALTCOIN_SEASON_TOP_N = 50;
const CHART_BATCH_SIZE = 6;
const MIN_ALTCOIN_SAMPLE = 20;

const EXCLUDED_COIN_IDS = new Set([
  'tether',
  'usd-coin',
  'dai',
  'first-digital-usd',
  'usds',
  'ethena-usde',
  'paypal-usd',
  'true-usd',
  'frax',
  'liquity-usd',
  'wrapped-bitcoin',
  'coinbase-wrapped-btc',
  'lido-staked-ether',
  'wrapped-steth',
  'wrapped-beacon-eth',
  'weth',
  'staked-ether',
  'binance-bridged-usdt-bnb-smart-chain',
  'usdd',
  'paxos-standard',
  'gemini-dollar',
  'tether-gold',
]);

interface CoinGeckoGlobalResponse {
  data?: {
    total_market_cap?: { usd?: number };
    market_cap_change_percentage_24h_usd?: number;
    total_volume?: { usd?: number };
  };
}

interface FearGreedResponse {
  data?: Array<{ value?: string; value_classification?: string }>;
}

interface CoinGeckoMarketRow {
  id: string;
  symbol: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  total_volume?: number;
  price_change_percentage_30d?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
}

interface CoinGeckoMarketChartResponse {
  market_caps?: Array<[number, number]>;
  prices?: Array<[number, number]>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class MarketMetricsService implements OnModuleDestroy {
  private readonly logger = new Logger(MarketMetricsService.name);
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.redis = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      maxRetriesPerRequest: 1,
    });
  }

  async getPublic(): Promise<MarketMetricsDto> {
    const hot = await this.redis.get(CACHE_KEY);
    if (hot) {
      return JSON.parse(hot) as MarketMetricsDto;
    }

    const previous = await this.readStaleCache();

    try {
      const metrics = await this.fetchLive(previous);
      await this.writeCaches(metrics);
      return metrics;
    } catch (error) {
      this.logger.warn(
        `Market metrics refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (previous) {
        return previous;
      }
      return this.getHomeContentFallback();
    }
  }

  private async readStaleCache(): Promise<MarketMetricsDto | null> {
    const stale = await this.redis.get(`${CACHE_KEY}:stale`);
    if (stale) {
      return JSON.parse(stale) as MarketMetricsDto;
    }
    return null;
  }

  private async writeCaches(metrics: MarketMetricsDto): Promise<void> {
    const json = JSON.stringify(metrics);
    await Promise.all([
      this.redis.set(CACHE_KEY, json, 'EX', CACHE_TTL_SEC),
      this.redis.set(`${CACHE_KEY}:stale`, json, 'EX', STALE_TTL_SEC),
    ]);
  }

  private async fetchJson<T>(url: string, label: string): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (response.ok) {
        return (await response.json()) as T;
      }
      if (response.status === 429 && attempt < maxAttempts) {
        await sleep(1500 * attempt);
        continue;
      }
      throw new Error(`${label} HTTP ${response.status}`);
    }
    throw new Error(`${label} failed after retries`);
  }

  private async fetch90dChange(coinId: string): Promise<number> {
    const chart = await this.fetchJson<CoinGeckoMarketChartResponse>(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=daily`,
      `CoinGecko ${coinId} 90d`,
    );
    return compute90dChangeFromPrices(chart.prices ?? []);
  }

  private async computeAltcoinSeasonIndex90d(
    markets: CoinGeckoMarketRow[],
  ): Promise<{ index: number; windowDays: 90 }> {
    const altIds = markets
      .filter((row) => row.id !== 'bitcoin' && !EXCLUDED_COIN_IDS.has(row.id))
      .slice(0, ALTCOIN_SEASON_TOP_N)
      .map((row) => row.id);

    if (altIds.length === 0) {
      throw new Error('No altcoins for season index');
    }

    const btcChange90d = await this.fetch90dChange('bitcoin');
    let outperforming = 0;
    let valid = 0;

    for (let i = 0; i < altIds.length; i += CHART_BATCH_SIZE) {
      const batch = altIds.slice(i, i + CHART_BATCH_SIZE);
      const results = await Promise.allSettled(batch.map((id) => this.fetch90dChange(id)));
      for (const result of results) {
        if (result.status === 'fulfilled') {
          valid++;
          if (result.value > btcChange90d) outperforming++;
        }
      }
      if (i + CHART_BATCH_SIZE < altIds.length) {
        await sleep(600);
      }
    }

    if (valid < MIN_ALTCOIN_SAMPLE) {
      throw new Error(`Insufficient 90d sample (${valid}/${altIds.length})`);
    }

    return {
      index: Math.max(0, Math.min(100, Math.round((outperforming / valid) * 100))),
      windowDays: 90,
    };
  }

  private async resolveAltcoinSeason(
    markets: CoinGeckoMarketRow[],
    previous: MarketMetricsDto | null,
  ): Promise<{ index: number; label: string }> {
    try {
      const result90d = await this.computeAltcoinSeasonIndex90d(markets);
      const label = altcoinSeasonLabel(result90d.index);
      return { index: result90d.index, label: `${label} · 90d` };
    } catch (error90d) {
      this.logger.warn(
        `90d altcoin season failed: ${error90d instanceof Error ? error90d.message : String(error90d)}`,
      );
    }

    try {
      const result30d = computeAltcoinSeasonFrom30dMarkets(
        markets,
        EXCLUDED_COIN_IDS,
        ALTCOIN_SEASON_TOP_N,
      );
      if (result30d.sampleSize >= MIN_ALTCOIN_SAMPLE) {
        const label = altcoinSeasonLabel(result30d.index);
        return { index: result30d.index, label: `${label} · 30d` };
      }
    } catch (error30d) {
      this.logger.warn(
        `30d altcoin season failed: ${error30d instanceof Error ? error30d.message : String(error30d)}`,
      );
    }

    if (previous) {
      return {
        index: previous.altcoinSeasonIndex,
        label: previous.altcoinSeasonLabel,
      };
    }

    throw new Error('Altcoin season unavailable');
  }

  private async fetchLive(previous: MarketMetricsDto | null): Promise<MarketMetricsDto> {
    let marketCapUsd: number | undefined;
    let marketCapChange: number | undefined;
    let totalVolumeUsd: number | undefined;
    let fearGreedValue: number | undefined;
    let fearGreedLabel: string | undefined;
    let marketsJson: CoinGeckoMarketRow[] | undefined;
    let marketCapChart24h: MarketMetricsDto['marketCapChart24h'];

    try {
      const globalJson = await this.fetchJson<CoinGeckoGlobalResponse>(
        'https://api.coingecko.com/api/v3/global',
        'CoinGecko global',
      );
      marketCapUsd = globalJson.data?.total_market_cap?.usd;
      marketCapChange = globalJson.data?.market_cap_change_percentage_24h_usd;
      totalVolumeUsd = globalJson.data?.total_volume?.usd;
    } catch (error) {
      this.logger.warn(
        `Global metrics failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const fngJson = await this.fetchJson<FearGreedResponse>(
        'https://api.alternative.me/fng/?limit=1',
        'Alternative.me FNG',
      );
      const fngPoint = fngJson.data?.[0];
      fearGreedValue = Number(fngPoint?.value);
      fearGreedLabel = fngPoint?.value_classification?.trim();
    } catch (error) {
      this.logger.warn(
        `Fear & Greed failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (marketCapUsd == null || marketCapChange == null) {
      if (!previous) throw new Error('Market cap unavailable');
      marketCapUsd = undefined;
      marketCapChange = undefined;
    }

    if (!Number.isFinite(fearGreedValue) || !fearGreedLabel) {
      if (!previous) throw new Error('Fear & Greed unavailable');
      fearGreedValue = undefined;
      fearGreedLabel = undefined;
    }

    try {
      await sleep(400);
      marketsJson = await this.fetchJson<CoinGeckoMarketRow[]>(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=30d',
        'CoinGecko markets',
      );
    } catch (error) {
      this.logger.warn(
        `Markets failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const btcRow = marketsJson?.find((row) => row.id === 'bitcoin');
    let btcPriceUsd = btcRow?.current_price;
    let btcChange24h = btcRow?.price_change_percentage_24h;

    let altcoinSeasonIndex = previous?.altcoinSeasonIndex;
    let altcoinSeasonLabelText = previous?.altcoinSeasonLabel;

    if (marketsJson) {
      try {
        const altcoin = await this.resolveAltcoinSeason(marketsJson, previous);
        altcoinSeasonIndex = altcoin.index;
        altcoinSeasonLabelText = altcoin.label;
      } catch (error) {
        this.logger.warn(
          `Altcoin season unresolved: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (marketCapUsd != null) {
      try {
        await sleep(400);
        const chartJson = await this.fetchJson<CoinGeckoMarketChartResponse>(
          'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1',
          'CoinGecko BTC market chart',
        );
        const scaled = scaleBtcMarketCapChart(chartJson.market_caps ?? [], marketCapUsd);
        marketCapChart24h = downsampleMarketCapChart(scaled);
      } catch (error) {
        this.logger.warn(
          `Market cap chart failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const metrics: MarketMetricsDto = {
      totalMarketCap:
        marketCapUsd != null
          ? formatMarketCapUsd(marketCapUsd)
          : (previous?.totalMarketCap ?? ''),
      totalMarketCapChange24h: marketCapChange ?? previous?.totalMarketCapChange24h ?? 0,
      totalVolume24h:
        totalVolumeUsd != null && Number.isFinite(totalVolumeUsd)
          ? formatUsdCompact(totalVolumeUsd)
          : previous?.totalVolume24h,
      btcPrice:
        btcPriceUsd != null && Number.isFinite(btcPriceUsd)
          ? formatBtcPrice(btcPriceUsd)
          : previous?.btcPrice,
      btcChange24h:
        btcChange24h != null && Number.isFinite(btcChange24h)
          ? btcChange24h
          : previous?.btcChange24h,
      altcoinSeasonIndex: altcoinSeasonIndex ?? previous?.altcoinSeasonIndex ?? 50,
      altcoinSeasonLabel:
        altcoinSeasonLabelText ??
        previous?.altcoinSeasonLabel ??
        `${altcoinSeasonLabel(50)} · 90d`,
      fearGreedValue:
        fearGreedValue != null && Number.isFinite(fearGreedValue)
          ? Math.max(0, Math.min(100, Math.round(fearGreedValue)))
          : (previous?.fearGreedValue ?? 0),
      fearGreedLabel: fearGreedLabel ?? previous?.fearGreedLabel ?? '—',
      marketCapChart24h: marketCapChart24h ?? previous?.marketCapChart24h,
    };

    if (!metrics.totalMarketCap || metrics.fearGreedLabel === '—') {
      throw new Error('Incomplete metrics and no cache to merge');
    }

    return metrics;
  }

  private async getHomeContentFallback(): Promise<MarketMetricsDto> {
    const content = await this.prisma.homeContent.findUnique({ where: { id: 'default' } });
    if (!content) {
      throw new Error('Home content not found for market metrics fallback');
    }
    return mapHomeContentToMetrics(content);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
