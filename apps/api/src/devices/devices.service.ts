import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DeviceNotificationPreferencesDto,
  DeviceNotificationPreferencesUpdateDto,
  mergeNotificationPreferences,
} from '@qpulse/shared';
import { PrismaService } from '../prisma/prisma.service';

type PreferenceRow = {
  deviceId: string;
  signalsNew: boolean;
  signalsTp: boolean;
  signalsSl: boolean;
  signalsLiquidation: boolean;
  signalsClosed: boolean;
  signalsUpdates: boolean;
  priceAlerts: boolean;
  spotEnabled: boolean;
  futuresEnabled: boolean;
};

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  register(data: { pushToken: string; platform: string; deviceId?: string }) {
    return this.prisma.deviceToken.upsert({
      where: { pushToken: data.pushToken },
      create: { ...data, isActive: true },
      update: { ...data, isActive: true },
    });
  }

  unregister(pushToken: string) {
    return this.prisma.deviceToken.updateMany({
      where: { pushToken },
      data: { isActive: false },
    });
  }

  async getNotificationPreferences(deviceId: string): Promise<DeviceNotificationPreferencesDto> {
    if (!deviceId?.trim()) {
      throw new BadRequestException('deviceId is required');
    }

    const row = await this.prisma.deviceNotificationPreferences.findUnique({
      where: { deviceId },
    });

    if (!row) {
      return mergeNotificationPreferences(deviceId);
    }

    return this.toDto(row);
  }

  async updateNotificationPreferences(
    body: DeviceNotificationPreferencesUpdateDto,
  ): Promise<DeviceNotificationPreferencesDto> {
    const { deviceId, ...updates } = body;
    if (!deviceId?.trim()) {
      throw new BadRequestException('deviceId is required');
    }

    const hasUpdate = Object.values(updates).some((value) => value !== undefined);
    if (!hasUpdate) {
      throw new BadRequestException('At least one preference field is required');
    }

    const row = await this.prisma.deviceNotificationPreferences.upsert({
      where: { deviceId },
      create: mergeNotificationPreferences(deviceId, updates),
      update: updates,
    });

    return this.toDto(row);
  }

  private toDto(row: PreferenceRow): DeviceNotificationPreferencesDto {
    return {
      deviceId: row.deviceId,
      signalsNew: row.signalsNew,
      signalsTp: row.signalsTp,
      signalsSl: row.signalsSl,
      signalsLiquidation: row.signalsLiquidation,
      signalsClosed: row.signalsClosed,
      signalsUpdates: row.signalsUpdates,
      priceAlerts: row.priceAlerts,
      spotEnabled: row.spotEnabled,
      futuresEnabled: row.futuresEnabled,
    };
  }
}
