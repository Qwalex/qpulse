import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientErrorsService } from './client-errors.service';

@ApiTags('admin/client-errors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/client-errors')
export class ClientErrorsAdminController {
  constructor(private readonly clientErrors: ClientErrorsService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.clientErrors.list(limit ? Number(limit) : undefined);
  }
}
