import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { ResultsAdminController } from './results-admin.controller';

@Module({
  controllers: [ResultsController, ResultsAdminController],
  providers: [ResultsService],
})
export class ResultsModule {}
