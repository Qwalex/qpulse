import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/results-summary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/results-summary')
export class ResultsAdminController {
  constructor(private readonly results: ResultsService) {}

  @Get()
  list() {
    return this.results.listSummaries();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.results.upsertSummary(body);
  }

  @Patch(':marketType/:timeframe')
  update(
    @Param('marketType') marketType: string,
    @Param('timeframe') timeframe: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.results.upsertSummary({ ...body, marketType, timeframe });
  }

  @Delete(':marketType/:timeframe')
  remove(@Param('marketType') marketType: string, @Param('timeframe') timeframe: string) {
    return this.results.deleteSummary(marketType, timeframe);
  }
}
