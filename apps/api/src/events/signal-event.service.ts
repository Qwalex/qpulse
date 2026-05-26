import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Signal, SignalEventType, SignalStatus } from '@prisma/client';
import { SignalEventType as SharedEventType } from '@qpulse/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { mapSignal } from '../common/mappers/signal.mapper';

const PRIORITY: SignalEventType[] = [
  SignalEventType.SIGNAL_CANCELLED,
  SignalEventType.LIQUIDATED,
  SignalEventType.SL_HIT,
  SignalEventType.SIGNAL_CLOSED,
  SignalEventType.TP_HIT,
  SignalEventType.SIGNAL_CREATED,
  SignalEventType.SIGNAL_UPDATED,
];

@Injectable()
export class SignalEventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    @InjectQueue('push-notifications') private readonly pushQueue: Queue,
  ) {}

  async handleCreate(signal: Signal) {
    await this.emit(signal, null, true);
  }

  async handleUpdate(before: Signal, after: Signal) {
    await this.emit(after, before, false);
  }

  async handleDelete(signalId: string, marketType: string) {
    this.realtime.broadcast('signal:deleted', { signalId }, [`signals:${marketType.toLowerCase()}`, 'signals:all']);
  }

  private async emit(after: Signal, before: Signal | null, isCreate: boolean) {
    const eventType = this.resolveEvent(before, after, isCreate);
    const dto = mapSignal(after);

    this.realtime.broadcast('signal:updated', dto, [
      `signals:${after.marketType.toLowerCase()}`,
      'signals:all',
    ]);

    if (eventType) {
      await this.prisma.signalEventLog.create({
        data: {
          signalId: after.id,
          eventType,
          payload: { tpLevel: after.currentTpLevel, profitPercentage: after.profitPercentage },
        },
      });

      this.realtime.broadcast(
        'signal:event',
        { eventType, signalId: after.id, tpLevel: after.currentTpLevel },
        [`signals:${after.marketType.toLowerCase()}`, 'signals:all'],
      );

      await this.pushQueue.add(
        'push',
        {
          eventType,
          signalId: after.id,
          payload: dto as unknown as Record<string, unknown>,
        },
        {
          attempts: 4,
          backoff: { type: 'custom' },
        },
      );
    }
  }

  private resolveEvent(before: Signal | null, after: Signal, isCreate: boolean): SignalEventType | null {
    const candidates: SignalEventType[] = [];

    if (before && before.status !== after.status && after.status === SignalStatus.CANCELLED) {
      candidates.push(SignalEventType.SIGNAL_CANCELLED);
    }
    if (
      after.liquidated &&
      (!before || !before.liquidated) &&
      after.status === SignalStatus.CLOSED
    ) {
      candidates.push(SignalEventType.LIQUIDATED);
    }
    if (before && !before.slHit && after.slHit) {
      candidates.push(SignalEventType.SL_HIT);
    }
    if (before && before.status !== after.status && after.status === SignalStatus.CLOSED) {
      candidates.push(SignalEventType.SIGNAL_CLOSED);
    }
    if (
      before &&
      (before.currentTpLevel ?? 0) < (after.currentTpLevel ?? 0)
    ) {
      candidates.push(SignalEventType.TP_HIT);
    }
    if (isCreate) {
      candidates.push(SignalEventType.SIGNAL_CREATED);
    }
    if (before && candidates.length === 0) {
      candidates.push(SignalEventType.SIGNAL_UPDATED);
    }

    for (const type of PRIORITY) {
      if (candidates.includes(type)) {
        return type;
      }
    }
    return isCreate ? SignalEventType.SIGNAL_CREATED : SignalEventType.SIGNAL_UPDATED;
  }
}

export { SharedEventType };
