import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SignalEventService } from './signal-event.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'push-notifications' }),
    forwardRef(() => RealtimeModule),
  ],
  providers: [SignalEventService],
  exports: [SignalEventService],
})
export class EventsModule {}
