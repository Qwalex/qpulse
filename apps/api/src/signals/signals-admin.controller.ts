import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SignalsService } from './signals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/signals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/signals')
export class SignalsAdminController {
  constructor(private readonly signals: SignalsService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('marketType') marketType?: string) {
    return this.signals.findAdmin({ status, marketType });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.signals.findOne(id);
  }

  @Post('batch-delete')
  batchDelete(@Body() body: { ids?: string[] }) {
    return this.signals.removeMany(body.ids ?? []);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.signals.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.signals.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.signals.remove(id);
  }
}
