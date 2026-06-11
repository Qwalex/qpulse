import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MarketType,
  PriceAlertCondition,
  PriceAlertSource,
  SignalStatus,
} from '@prisma/client';
import { WATCHLIST_MAX, type PriceWatchStateDto } from '@qpulse/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BybitPriceFeedService } from './bybit-price-feed.service';
import { PriceAlertEvaluatorService } from './price-alert.evaluator.service';
import {
  buildTickerDto,
  mapPriceAlert,
  mapWatchlistCoin,
  normalizePairInput,
} from './price-watch.mapper';

@Injectable()
export class PriceWatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: BybitPriceFeedService,
    private readonly evaluator: PriceAlertEvaluatorService,
  ) {}

  async getState(deviceId: string): Promise<PriceWatchStateDto> {
    if (!deviceId?.trim()) {
      throw new BadRequestException('deviceId is required');
    }

    const [watchlist, alerts] = await Promise.all([
      this.prisma.watchlistCoin.findMany({
        where: { deviceId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.priceAlert.findMany({
        where: { deviceId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const uniqueSymbols = new Map<string, { symbol: string; marketType: MarketType }>();
    for (const row of watchlist) {
      uniqueSymbols.set(`${row.marketType}:${row.symbol}`, {
        symbol: row.symbol,
        marketType: row.marketType,
      });
    }
    for (const row of alerts) {
      uniqueSymbols.set(`${row.marketType}:${row.symbol}`, {
        symbol: row.symbol,
        marketType: row.marketType,
      });
    }

    const tickers = [...uniqueSymbols.values()].map((entry) => {
      const cached = this.evaluator.getCachedTicker(entry.symbol, entry.marketType);
      if (cached) {
        return buildTickerDto(
          cached.symbol,
          cached.marketType,
          cached.price,
          cached.change24hPct,
          cached.updatedAt,
        );
      }
      return buildTickerDto(entry.symbol, entry.marketType, 0, null, new Date());
    });

    return {
      watchlist: watchlist.map(mapWatchlistCoin),
      alerts: alerts.map(mapPriceAlert),
      tickers,
    };
  }

  async addWatchlistCoin(deviceId: string, pair: string, marketType: MarketType) {
    const { symbol, pairLabel } = normalizePairInput(pair);
    await this.assertSymbolOnBybit(symbol, marketType);

    const count = await this.prisma.watchlistCoin.count({ where: { deviceId } });
    if (count >= WATCHLIST_MAX) {
      throw new BadRequestException(`Watchlist limit is ${WATCHLIST_MAX} coins`);
    }

    try {
      const row = await this.prisma.watchlistCoin.create({
        data: {
          deviceId,
          symbol,
          pairLabel,
          marketType,
          sortOrder: count,
        },
      });
      await this.resyncFeed();
      return mapWatchlistCoin(row);
    } catch {
      throw new ConflictException('Coin already in watchlist');
    }
  }

  async removeWatchlistCoin(id: string, deviceId: string) {
    const result = await this.prisma.watchlistCoin.deleteMany({ where: { id, deviceId } });
    if (result.count === 0) {
      throw new NotFoundException('Watchlist item not found');
    }
    await this.resyncFeed();
    return { ok: true };
  }

  async createAlert(
    deviceId: string,
    pair: string,
    marketType: MarketType,
    targetPrice: number,
    condition: PriceAlertCondition,
  ) {
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      throw new BadRequestException('targetPrice must be positive');
    }

    const { symbol, pairLabel } = normalizePairInput(pair);
    await this.assertSymbolOnBybit(symbol, marketType);

    const lastPrice = await this.feed.fetchLastPrice(symbol, marketType);

    const row = await this.prisma.priceAlert.create({
      data: {
        deviceId,
        symbol,
        pairLabel,
        marketType,
        targetPrice,
        condition,
        source: PriceAlertSource.MANUAL,
        lastPrice: lastPrice ?? undefined,
      },
    });

    await this.resyncFeed();
    return mapPriceAlert(row);
  }

  async createEntryAlertFromSignal(deviceId: string, signalId: string) {
    const signal = await this.prisma.signal.findUnique({ where: { id: signalId } });
    if (!signal) {
      throw new NotFoundException('Signal not found');
    }
    if (signal.status !== SignalStatus.OPEN && signal.status !== SignalStatus.ACTIVE) {
      throw new BadRequestException('Only OPEN/ACTIVE signals can be tracked');
    }

    const existing = await this.prisma.priceAlert.findFirst({
      where: { deviceId, signalId, isActive: true },
    });
    if (existing) {
      return mapPriceAlert(existing);
    }

    const { symbol, pairLabel } = normalizePairInput(signal.pair);
    await this.assertSymbolOnBybit(symbol, signal.marketType);

    const entryPrice = signal.entryPrice.toNumber();
    const lastPrice = await this.feed.fetchLastPrice(symbol, signal.marketType);

    const row = await this.prisma.priceAlert.create({
      data: {
        deviceId,
        symbol,
        pairLabel,
        marketType: signal.marketType,
        targetPrice: entryPrice,
        condition: PriceAlertCondition.AT,
        source: PriceAlertSource.SIGNAL_ENTRY,
        signalId: signal.id,
        lastPrice: lastPrice ?? undefined,
      },
    });

    await this.resyncFeed();
    return mapPriceAlert(row);
  }

  async removeAlert(id: string, deviceId: string) {
    const result = await this.prisma.priceAlert.updateMany({
      where: { id, deviceId },
      data: { isActive: false, triggeredAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Alert not found');
    }
    await this.resyncFeed();
    return { ok: true };
  }

  async resyncFeedOnBoot() {
    await this.resyncFeed();
  }

  private async resyncFeed() {
    const [watchlist, alerts] = await Promise.all([
      this.prisma.watchlistCoin.findMany({
        select: { symbol: true, marketType: true },
      }),
      this.prisma.priceAlert.findMany({
        where: { isActive: true },
        select: { symbol: true, marketType: true },
      }),
    ]);

    const unique = new Map<string, { symbol: string; marketType: MarketType }>();
    for (const row of [...watchlist, ...alerts]) {
      unique.set(`${row.marketType}:${row.symbol}`, row);
    }

    await this.feed.resyncSubscriptions([...unique.values()]);
  }

  private async assertSymbolOnBybit(symbol: string, marketType: MarketType) {
    const price = await this.feed.fetchLastPrice(symbol, marketType);
    if (price == null) {
      throw new BadRequestException(`Symbol ${symbol} is not available on Bybit ${marketType}`);
    }
  }
}
