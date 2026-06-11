import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MarketType, PriceAlertCondition } from '@prisma/client';
import { PriceWatchService } from './price-watch.service';

@ApiTags('price-watch')
@Controller('price-watch')
export class PriceWatchController {
  constructor(private readonly priceWatch: PriceWatchService) {}

  @Get()
  getState(@Query('deviceId') deviceId: string) {
    return this.priceWatch.getState(deviceId);
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Post('watchlist')
  addWatchlist(
    @Body() body: { deviceId: string; pair: string; marketType: MarketType },
  ) {
    return this.priceWatch.addWatchlistCoin(body.deviceId, body.pair, body.marketType);
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Delete('watchlist/:id')
  removeWatchlist(@Param('id') id: string, @Query('deviceId') deviceId: string) {
    return this.priceWatch.removeWatchlistCoin(id, deviceId);
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Post('alerts')
  createAlert(
    @Body()
    body: {
      deviceId: string;
      pair: string;
      marketType: MarketType;
      targetPrice: number;
      condition: PriceAlertCondition;
    },
  ) {
    return this.priceWatch.createAlert(
      body.deviceId,
      body.pair,
      body.marketType,
      body.targetPrice,
      body.condition,
    );
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Post('alerts/from-signal')
  createFromSignal(@Body() body: { deviceId: string; signalId: string }) {
    return this.priceWatch.createEntryAlertFromSignal(body.deviceId, body.signalId);
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Delete('alerts/:id')
  removeAlert(@Param('id') id: string, @Query('deviceId') deviceId: string) {
    return this.priceWatch.removeAlert(id, deviceId);
  }
}
