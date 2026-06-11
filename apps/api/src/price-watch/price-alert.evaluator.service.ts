import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MarketType, PriceAlertSource } from '@prisma/client';
import { priceDeviceChannel } from '@qpulse/shared';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { BybitPriceFeedService, type BybitTickerUpdate } from './bybit-price-feed.service';
import {
  buildTickerDto,
  formatAlertTargetPrice,
  shouldTriggerAlert,
} from './price-watch.mapper';
import { PriceAlertPushService } from './price-alert-push.service';

@Injectable()
export class PriceAlertEvaluatorService implements OnModuleInit {
  private readonly logger = new Logger(PriceAlertEvaluatorService.name);
  private readonly tickerCache = new Map<string, BybitTickerUpdate>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: BybitPriceFeedService,
    private readonly push: PriceAlertPushService,
    private readonly realtime: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.feed.setTickHandler((update) => {
      void this.handleTick(update);
    });
  }

  getCachedTicker(symbol: string, marketType: MarketType): BybitTickerUpdate | undefined {
    return this.tickerCache.get(this.cacheKey(symbol, marketType));
  }

  getCachedTickers(
    entries: Array<{ symbol: string; marketType: MarketType }>,
  ): BybitTickerUpdate[] {
    const result: BybitTickerUpdate[] = [];
    for (const entry of entries) {
      const cached = this.getCachedTicker(entry.symbol, entry.marketType);
      if (cached) result.push(cached);
    }
    return result;
  }

  private cacheKey(symbol: string, marketType: MarketType): string {
    return `${marketType}:${symbol.toUpperCase()}`;
  }

  private async handleTick(update: BybitTickerUpdate) {
    const key = this.cacheKey(update.symbol, update.marketType);
    this.tickerCache.set(key, update);

    const deviceIds = await this.findDeviceIdsForSymbol(update.symbol, update.marketType);
    if (deviceIds.length > 0) {
      const tickerDto = buildTickerDto(
        update.symbol,
        update.marketType,
        update.price,
        update.change24hPct,
        update.updatedAt,
      );
      for (const deviceId of deviceIds) {
        this.realtime.broadcast('price:ticker', tickerDto, [priceDeviceChannel(deviceId)]);
      }
    }

    const alerts = await this.prisma.priceAlert.findMany({
      where: {
        isActive: true,
        symbol: update.symbol.toUpperCase(),
        marketType: update.marketType,
      },
    });

    for (const alert of alerts) {
      const target = alert.targetPrice.toNumber();
      const lastPrice = alert.lastPrice?.toNumber() ?? null;

      await this.prisma.priceAlert.update({
        where: { id: alert.id },
        data: { lastPrice: update.price },
      });

      if (!shouldTriggerAlert(alert.condition, update.price, target, lastPrice)) {
        continue;
      }

      await this.prisma.priceAlert.update({
        where: { id: alert.id },
        data: { isActive: false, triggeredAt: new Date(), lastPrice: update.price },
      });

      const targetLabel = formatAlertTargetPrice(target);
      const title =
        alert.source === PriceAlertSource.SIGNAL_ENTRY ? 'Entry Price Hit' : 'Price Alert';
      const body =
        alert.source === PriceAlertSource.SIGNAL_ENTRY
          ? `${alert.pairLabel} reached entry ${targetLabel}`
          : `${alert.pairLabel} reached ${targetLabel}`;

      const deepLink =
        alert.marketType === MarketType.SPOT ? '/(tabs)/spots' : '/(tabs)/futures';

      await this.push.sendPriceAlert({
        deviceId: alert.deviceId,
        alertId: alert.id,
        title,
        body,
        deepLink,
        pairLabel: alert.pairLabel,
      });

      this.logger.log(`Price alert triggered: ${alert.pairLabel} @ ${update.price}`);
    }
  }

  private async findDeviceIdsForSymbol(
    symbol: string,
    marketType: MarketType,
  ): Promise<string[]> {
    const upper = symbol.toUpperCase();
    const [watchlist, alerts] = await Promise.all([
      this.prisma.watchlistCoin.findMany({
        where: { symbol: upper, marketType },
        select: { deviceId: true },
      }),
      this.prisma.priceAlert.findMany({
        where: { symbol: upper, marketType, isActive: true },
        select: { deviceId: true },
      }),
    ]);
    return [...new Set([...watchlist.map((w) => w.deviceId), ...alerts.map((a) => a.deviceId)])];
  }
}
