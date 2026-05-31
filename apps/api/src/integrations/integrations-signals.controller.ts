import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { SignalsService } from '../signals/signals.service';
import { INTEGRATIONS_API_KEY_HEADER } from './integrations.constants';
import { IntegrationsApiKeyGuard } from './integrations-api-key.guard';

@ApiTags('integrations/signals')
@ApiHeader({ name: INTEGRATIONS_API_KEY_HEADER, required: true })
@UseGuards(IntegrationsApiKeyGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('integrations/signals')
export class IntegrationsSignalsController {
  constructor(private readonly signals: SignalsService) {}

  @Post()
  upsert(@Body() body: Record<string, unknown>) {
    const externalId = String(body.externalId ?? '').trim();
    return this.signals.upsertByExternalId(externalId, body);
  }

  @Patch(':externalId')
  update(@Param('externalId') externalId: string, @Body() body: Record<string, unknown>) {
    return this.signals.updateByExternalId(externalId, body);
  }
}
