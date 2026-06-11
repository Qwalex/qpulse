import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketMetricsService } from './market-metrics.service';

@ApiTags('market-metrics')
@Controller('market-metrics')
export class MarketMetricsController {
  constructor(private readonly marketMetrics: MarketMetricsService) {}

  @Get()
  get() {
    return this.marketMetrics.getPublic();
  }
}
