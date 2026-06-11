import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MarketMetricsDto } from '@qpulse/shared';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import {
  altcoinSeasonLabel,
  compute90dChangeFromPrices,
  downsampleMarketCapChart,
  formatBtcPrice,
  formatMarketCapUsd,
  formatUsdCompact,
  mapHomeContentToMetrics,
  scaleBtcMarketCapChart,
} from './market-metrics.mapper';

const CACHE_KEY = 'qpulse:market-metrics:v4';
const CACHE_TTL_SEC = 600;
const ALTCOIN_SEASON_TOP_N = 50;
const CHART_BATCH_SIZE = 8;

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
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as MarketMetricsDto;
    }

    try {
      const metrics = await this.fetchLive();
      await this.redis.set(CACHE_KEY, JSON.stringify(metrics), 'EX', CACHE_TTL_SEC);
      return metrics;
    } catch (error) {
      this.logger.warn(
        `Live market metrics failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      const stale = await this.redis.get(`${CACHE_KEY}:stale`);
      if (stale) {
        return JSON.parse(stale) as MarketMetricsDto;
      }
      return this.getHomeContentFallback();
    }
  }

  private async fetchJson<T>(url: string, label: string): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (response.ok) {
        return (await response.json()) as T;
      }
      if (response.status === 429 && attempt < maxAttempts) {
        await sleep(1000 * attempt);
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

  private async computeAltcoinSeasonIndex90d(markets: CoinGeckoMarketRow[]): Promise<number> {
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
        await sleep(400);
      }
    }

    if (valid === 0) {
      throw new Error('No valid 90d altcoin performance data');
    }

    return Math.max(0, Math.min(100, Math.round((outperforming / valid) * 100)));
  }

  private async fetchLive(): Promise<MarketMetricsDto> {
    const [globalJson, fngJson] = await Promise.all([
      this.fetchJson<CoinGeckoGlobalResponse>(
        'https://api.coingecko.com/api/v3/global',
        'CoinGecko global',
      ),
      this.fetchJson<FearGreedResponse>(
        'https://api.alternative.me/fng/?limit=1',
        'Alternative.me FNG',
      ),
    ]);

    const marketCapUsd = globalJson.data?.total_market_cap?.usd;
    const marketCapChange = globalJson.data?.market_cap_change_percentage_24h_usd;
    const totalVolumeUsd = globalJson.data?.total_volume?.usd;
    if (marketCapUsd == null || marketCapChange == null) {
      throw new Error('CoinGecko response missing market cap fields');
    }

    const fngPoint = fngJson.data?.[0];
    const fearGreedValue = Number(fngPoint?.value);
    const fearGreedLabel = fngPoint?.value_classification?.trim();
    if (!Number.isFinite(fearGreedValue) || !fearGreedLabel) {
      throw new Error('Fear & Greed response missing fields');
    }

    await sleep(300);
    const marketsJson = await this.fetchJson<CoinGeckoMarketRow[]>(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
      'CoinGecko markets',
    );

    const btcRow = marketsJson.find((row) => row.id === 'bitcoin');
    const btcPriceUsd = btcRow?.current_price;
    const btcChange24h = btcRow?.price_change_percentage_24h;

    let altcoinSeasonIndex = 50;
    try {
      altcoinSeasonIndex = await this.computeAltcoinSeasonIndex90d(marketsJson);
    } catch (error) {
      this.logger.warn(
        `Altcoin season skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    let marketCapChart24h: MarketMetricsDto['marketCapChart24h'];
    try {
      await sleep(300);
      const chartJson = await this.fetchJson<CoinGeckoMarketChartResponse>(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1',
        'CoinGecko BTC market chart',
      );
      const scaled = scaleBtcMarketCapChart(chartJson.market_caps ?? [], marketCapUsd);
      marketCapChart24h = downsampleMarketCapChart(scaled);
    } catch (error) {
      this.logger.warn(
        `Market cap chart skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const metrics: MarketMetricsDto = {
      totalMarketCap: formatMarketCapUsd(marketCapUsd),
      totalMarketCapChange24h: marketCapChange,
      totalVolume24h:
        totalVolumeUsd != null && Number.isFinite(totalVolumeUsd)
          ? formatUsdCompact(totalVolumeUsd)
          : undefined,
      btcPrice:
        btcPriceUsd != null && Number.isFinite(btcPriceUsd)
          ? formatBtcPrice(btcPriceUsd)
          : undefined,
      btcChange24h:
        btcChange24h != null && Number.isFinite(btcChange24h) ? btcChange24h : undefined,
      altcoinSeasonIndex,
      altcoinSeasonLabel: altcoinSeasonLabel(altcoinSeasonIndex),
      fearGreedValue: Math.max(0, Math.min(100, Math.round(fearGreedValue))),
      fearGreedLabel,
      marketCapChart24h,
    };

    await this.redis.set(`${CACHE_KEY}:stale`, JSON.stringify(metrics), 'EX', 86400);
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
