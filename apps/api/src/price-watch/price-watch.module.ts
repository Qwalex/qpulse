import { Module, OnModuleInit } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { BybitPriceFeedService } from './bybit-price-feed.service';
import { PriceAlertEvaluatorService } from './price-alert.evaluator.service';
import { PriceAlertPushService } from './price-alert-push.service';
import { PriceWatchController } from './price-watch.controller';
import { PriceWatchService } from './price-watch.service';

@Module({
  imports: [RealtimeModule],
  controllers: [PriceWatchController],
  providers: [
    PriceWatchService,
    BybitPriceFeedService,
    PriceAlertEvaluatorService,
    PriceAlertPushService,
  ],
  exports: [PriceWatchService],
})
export class PriceWatchModule implements OnModuleInit {
  constructor(private readonly priceWatch: PriceWatchService) {}

  async onModuleInit() {
    await this.priceWatch.resyncFeedOnBoot();
  }
}
