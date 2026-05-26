import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResultsService } from './results.service';

@ApiTags('results')
@Controller('results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get()
  get(@Query('marketType') marketType: string, @Query('timeframe') timeframe?: string) {
    return this.results.getResults(marketType, timeframe);
  }
}
