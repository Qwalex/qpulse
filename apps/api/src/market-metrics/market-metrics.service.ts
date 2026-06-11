import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MarketMetricsDto } from '@qpulse/shared';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import {
  altcoinSeasonLabel,
  formatMarketCapUsd,
  mapHomeContentToMetrics,
} from './market-metrics.mapper';

const CACHE_KEY = 'qpulse:market-metrics:v2';
const CACHE_TTL_SEC = 600;

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
]);

interface CoinGeckoGlobalResponse {
  data?: {
    total_market_cap?: { usd?: number };
    market_cap_change_percentage_24h_usd?: number;
  };
}

interface FearGreedResponse {
  data?: Array<{ value?: string; value_classification?: string }>;
}

interface CoinGeckoMarketRow {
  id: string;
  symbol: string;
  price_change_percentage_30d?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
}

function coin30dChange(row: CoinGeckoMarketRow): number | null {
  const change = row.price_change_percentage_30d_in_currency ?? row.price_change_percentage_30d;
  return change == null ? null : change;
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
    if (marketCapUsd == null || marketCapChange == null) {
      throw new Error('CoinGecko response missing market cap fields');
    }

    const fngPoint = fngJson.data?.[0];
    const fearGreedValue = Number(fngPoint?.value);
    const fearGreedLabel = fngPoint?.value_classification?.trim();
    if (!Number.isFinite(fearGreedValue) || !fearGreedLabel) {
      throw new Error('Fear & Greed response missing fields');
    }

    let altcoinSeasonIndex = 50;
    try {
      await sleep(300);
      const marketsJson = await this.fetchJson<CoinGeckoMarketRow[]>(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=30d',
        'CoinGecko markets',
      );
      altcoinSeasonIndex = this.computeAltcoinSeasonIndex(marketsJson);
    } catch (error) {
      this.logger.warn(
        `Altcoin season skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const metrics: MarketMetricsDto = {
      totalMarketCap: formatMarketCapUsd(marketCapUsd),
      totalMarketCapChange24h: marketCapChange,
      altcoinSeasonIndex,
      altcoinSeasonLabel: altcoinSeasonLabel(altcoinSeasonIndex),
      fearGreedValue: Math.max(0, Math.min(100, Math.round(fearGreedValue))),
      fearGreedLabel,
    };

    await this.redis.set(`${CACHE_KEY}:stale`, JSON.stringify(metrics), 'EX', 86400);
    return metrics;
  }

  private computeAltcoinSeasonIndex(markets: CoinGeckoMarketRow[]): number {
    if (!Array.isArray(markets) || markets.length === 0) {
      throw new Error('CoinGecko markets response empty');
    }

    const btc = markets.find((row) => row.id === 'bitcoin');
    const btcChange = coin30dChange(btc ?? { id: 'bitcoin', symbol: 'btc' }) ?? 0;

    const alts = markets.filter(
      (row) =>
        row.id !== 'bitcoin' &&
        !EXCLUDED_COIN_IDS.has(row.id) &&
        coin30dChange(row) != null,
    );

    if (alts.length === 0) {
      throw new Error('No altcoins with 30d performance data');
    }

    const outperforming = alts.filter(
      (row) => (coin30dChange(row) ?? -Infinity) > btcChange,
    ).length;

    return Math.max(0, Math.min(100, Math.round((outperforming / alts.length) * 100)));
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
