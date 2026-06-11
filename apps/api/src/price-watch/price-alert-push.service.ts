import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { mergeNotificationPreferences, shouldDeliverPriceAlertPush } from '@qpulse/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PriceAlertPushService {
  private readonly logger = new Logger(PriceAlertPushService.name);
  private readonly expo: Expo | null;

  constructor(private readonly prisma: PrismaService) {
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    this.expo = accessToken ? new Expo({ accessToken }) : null;
  }

  async sendPriceAlert(params: {
    deviceId: string;
    alertId: string;
    title: string;
    body: string;
    deepLink: string;
    pairLabel: string;
  }): Promise<void> {
    const prefsRow = await this.prisma.deviceNotificationPreferences.findUnique({
      where: { deviceId: params.deviceId },
    });
    const prefs = prefsRow
      ? {
          deviceId: prefsRow.deviceId,
          signalsNew: prefsRow.signalsNew,
          signalsTp: prefsRow.signalsTp,
          signalsSl: prefsRow.signalsSl,
          signalsLiquidation: prefsRow.signalsLiquidation,
          signalsClosed: prefsRow.signalsClosed,
          signalsUpdates: prefsRow.signalsUpdates,
          priceAlerts: prefsRow.priceAlerts,
          spotEnabled: prefsRow.spotEnabled,
          futuresEnabled: prefsRow.futuresEnabled,
        }
      : mergeNotificationPreferences(params.deviceId);

    if (!shouldDeliverPriceAlertPush(prefs)) {
      await this.writeLog(
        params.deviceId,
        params.alertId,
        params.title,
        params.body,
        'skipped',
        'preference_disabled',
      );
      return;
    }

    const tokens = await this.prisma.deviceToken.findMany({
      where: { deviceId: params.deviceId, isActive: true },
    });

    if (tokens.length === 0) {
      await this.writeLog(params.deviceId, params.alertId, params.title, params.body, 'skipped');
      return;
    }

    if (!this.expo) {
      await this.writeLog(params.deviceId, params.alertId, params.title, params.body, 'skipped');
      return;
    }

    const messages: ExpoPushMessage[] = [];
    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token.pushToken)) {
        await this.writeLog(
          params.deviceId,
          params.alertId,
          params.title,
          params.body,
          'failed',
          'Invalid Expo push token',
        );
        continue;
      }
      messages.push({
        to: token.pushToken,
        title: params.title,
        body: params.body,
        channelId: 'price_alerts',
        priority: 'high',
        sound: 'default',
        data: {
          deepLink: params.deepLink,
          alertId: params.alertId,
          pairLabel: params.pairLabel,
        },
      });
    }

    if (messages.length === 0) return;

    try {
      const tickets = await this.expo.sendPushNotificationsAsync(messages);
      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          await this.writeLog(params.deviceId, params.alertId, params.title, params.body, 'sent');
        } else {
          await this.writeLog(
            params.deviceId,
            params.alertId,
            params.title,
            params.body,
            'failed',
            ticket.details?.error ?? 'Unknown Expo error',
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Expo push failed';
      this.logger.warn(message);
      await this.writeLog(params.deviceId, params.alertId, params.title, params.body, 'failed', message);
    }
  }

  private async writeLog(
    deviceId: string,
    alertId: string,
    title: string,
    body: string,
    status: string,
    error?: string,
  ) {
    await this.prisma.priceAlertLog.create({
      data: {
        deviceId,
        alertId,
        title,
        body,
        status,
        error: error ?? null,
      },
    });
  }
}
