import { Module } from '@nestjs/common';
import { MarketMetricsController } from './market-metrics.controller';
import { MarketMetricsService } from './market-metrics.service';

@Module({
  controllers: [MarketMetricsController],
  providers: [MarketMetricsService],
})
export class MarketMetricsModule {}
