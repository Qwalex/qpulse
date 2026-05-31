import { Module } from '@nestjs/common';

import { SignalsModule } from '../signals/signals.module';
import { IntegrationsApiKeyGuard } from './integrations-api-key.guard';
import { IntegrationsSignalsController } from './integrations-signals.controller';

@Module({
  imports: [SignalsModule],
  controllers: [IntegrationsSignalsController],
  providers: [IntegrationsApiKeyGuard],
})
export class IntegrationsModule {}
