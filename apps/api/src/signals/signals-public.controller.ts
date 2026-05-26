import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SignalsService } from './signals.service';

@ApiTags('signals')
@Controller('signals')
export class SignalsPublicController {
  constructor(private readonly signals: SignalsService) {}

  @Get()
  findAll(@Query('marketType') marketType: string, @Query('status') status?: string) {
    return this.signals.findPublic(marketType, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.signals.findOne(id);
  }
}
