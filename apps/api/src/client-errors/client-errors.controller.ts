import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClientErrorsService } from './client-errors.service';

@ApiTags('client-errors')
@Controller('client-errors')
export class ClientErrorsController {
  constructor(private readonly clientErrors: ClientErrorsService) {}

  @Throttle({ 'public-write': { limit: 30, ttl: 60_000 } })
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.clientErrors.create(body);
  }
}
