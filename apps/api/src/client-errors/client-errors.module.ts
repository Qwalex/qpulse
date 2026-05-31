import { Module } from '@nestjs/common';
import { ClientErrorsService } from './client-errors.service';
import { ClientErrorsController } from './client-errors.controller';
import { ClientErrorsAdminController } from './client-errors-admin.controller';

@Module({
  controllers: [ClientErrorsController, ClientErrorsAdminController],
  providers: [ClientErrorsService],
})
export class ClientErrorsModule {}
