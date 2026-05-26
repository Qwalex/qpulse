import { Module } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalsPublicController } from './signals-public.controller';
import { SignalsAdminController } from './signals-admin.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [SignalsPublicController, SignalsAdminController],
  providers: [SignalsService],
  exports: [SignalsService],
})
export class SignalsModule {}
