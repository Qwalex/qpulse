import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { SignalEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PUSH_BACKOFF_DELAYS = [5000, 30000, 120000];

@Processor('push-notifications', {
  settings: {
    backoffStrategy: (attemptsMade: number) =>
      PUSH_BACKOFF_DELAYS[attemptsMade - 1] ?? 120000,
  },
})
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);
  private readonly expo: Expo | null;

  constructor(private readonly prisma: PrismaService) {
    super();
    const accessToken = process.env.EXPO_ACCESS_TOKEN;
    this.expo = accessToken ? new Expo({ accessToken }) : null;
  }

  async process(
    job: Job<{ eventType: SignalEventType; signalId: string; payload: Record<string, unknown> }>,
  ) {
    const { eventType, payload } = job.data;
    const template = await this.prisma.notificationTemplate.findUnique({ where: { eventType } });
    if (!template) return;

    const title = this.render(template.titleTpl, payload);
    const body = this.render(template.bodyTpl, payload);
    const deepLink = this.render(template.deepLink, payload);
    const tokens = await this.prisma.deviceToken.findMany({ where: { isActive: true } });

    if (tokens.length === 0) return;

    if (!this.expo) {
      for (const token of tokens) {
        await this.writeLog(token.deviceId, eventType, title, body, 'skipped');
      }
      return;
    }

    const messages: ExpoPushMessage[] = [];
    const tokenByPushToken = new Map<string, (typeof tokens)[number]>();

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token.pushToken)) {
        await this.writeLog(token.deviceId, eventType, title, body, 'failed', 'Invalid Expo push token');
        await this.deactivateToken(token.pushToken);
        continue;
      }

      messages.push({
        to: token.pushToken,
        title,
        body,
        data: {
          deepLink,
          signalId: job.data.signalId,
          eventType,
        },
        channelId: template.channel,
        priority: template.priority === 'high' ? 'high' : 'default',
        sound: 'default',
      });
      tokenByPushToken.set(token.pushToken, token);
    }

    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      let tickets: ExpoPushTicket[];
      try {
        tickets = await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Expo push batch failed';
        this.logger.error(message);
        throw error;
      }

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const pushToken = chunk[i]?.to as string;
        const device = tokenByPushToken.get(pushToken);
        const deviceId = device?.deviceId ?? null;

        if (ticket.status === 'ok') {
          await this.writeLog(deviceId, eventType, title, body, 'sent');
          continue;
        }

        const errorCode = ticket.details?.error ?? 'Unknown Expo error';
        await this.writeLog(deviceId, eventType, title, body, 'failed', errorCode);

        if (errorCode === 'DeviceNotRegistered') {
          await this.deactivateToken(pushToken);
        }
      }
    }
  }

  private render(tpl: string, data: Record<string, unknown>) {
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
  }

  private async writeLog(
    deviceId: string | null | undefined,
    eventType: SignalEventType,
    title: string,
    body: string,
    status: string,
    error?: string,
  ) {
    await this.prisma.notificationLog.create({
      data: {
        deviceId: deviceId ?? null,
        eventType,
        title,
        body,
        status,
        error: error ?? null,
      },
    });
  }

  private async deactivateToken(pushToken: string) {
    await this.prisma.deviceToken.updateMany({
      where: { pushToken },
      data: { isActive: false },
    });
  }
}
