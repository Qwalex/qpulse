import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PushProcessor } from './push.processor';
import { NotificationsAdminController } from './notifications-admin.controller';

@Module({
  imports: [QueueModule],
  controllers: [NotificationsAdminController],
  providers: [PushProcessor],
})
export class NotificationsModule {}
