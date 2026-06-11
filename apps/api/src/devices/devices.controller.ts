import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { DeviceNotificationPreferencesUpdateDto } from '@qpulse/shared';
import { DevicesService } from './devices.service';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Post('register')
  register(@Body() body: { pushToken: string; platform: string; deviceId?: string }) {
    return this.devices.register(body);
  }

  @Throttle({ 'public-write': { limit: 20, ttl: 60_000 } })
  @Delete('unregister')
  unregister(@Body() body: { pushToken: string }) {
    return this.devices.unregister(body.pushToken);
  }

  @Get('notification-preferences')
  getNotificationPreferences(@Query('deviceId') deviceId: string) {
    return this.devices.getNotificationPreferences(deviceId);
  }

  @Throttle({ 'public-write': { limit: 30, ttl: 60_000 } })
  @Patch('notification-preferences')
  updateNotificationPreferences(@Body() body: DeviceNotificationPreferencesUpdateDto) {
    return this.devices.updateNotificationPreferences(body);
  }
}
