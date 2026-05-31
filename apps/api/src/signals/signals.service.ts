import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, SignalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapSignal, normalizeSignalInput } from '../common/mappers/signal.mapper';
import { applyDetailsExecutionFields } from '../common/utils/signal-details.util';
import { applyTradeMetrics } from '../common/utils/signal-trade.util';
import { parseLiveStatus, parseMarketType } from '../common/utils/query-params';
import { SignalEventService } from '../events/signal-event.service';

@Injectable()
export class SignalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: SignalEventService,
  ) {}

  async findPublic(marketTypeRaw: string, statusRaw?: string) {
    const marketType = parseMarketType(marketTypeRaw);
    const statuses = parseLiveStatus(statusRaw);
    const signals = await this.prisma.signal.findMany({
      where: { marketType, status: { in: statuses } },
      orderBy: { openDate: 'desc' },
    });
    return signals.map(mapSignal);
  }

  async findOne(id: string) {
    const signal = await this.prisma.signal.findUnique({ where: { id } });
    if (!signal) throw new NotFoundException('Signal not found');
    return mapSignal(signal);
  }

  async findAdmin(filters: { status?: string; marketType?: string }) {
    const where: Prisma.SignalWhereInput = {};
    if (filters.marketType) where.marketType = parseMarketType(filters.marketType);
    if (filters.status) {
      const map: Record<string, SignalStatus> = {
        open: SignalStatus.OPEN,
        active: SignalStatus.ACTIVE,
        closed: SignalStatus.CLOSED,
        cancelled: SignalStatus.CANCELLED,
      };
      where.status = map[filters.status.toLowerCase()];
    }
    const signals = await this.prisma.signal.findMany({ where, orderBy: { updatedAt: 'desc' } });
    return signals.map(mapSignal);
  }

  async create(data: Record<string, unknown>) {
    const normalized = applyTradeMetrics(applyDetailsExecutionFields(data));
    this.validateSignal(normalized);
    const created = await this.prisma.signal.create({
      data: this.toCreateInput(normalized),
    });
    await this.events.handleCreate(created);
    return mapSignal(created);
  }

  async update(id: string, data: Record<string, unknown>) {
    const before = await this.prisma.signal.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Signal not found');
    const normalized = applyTradeMetrics(applyDetailsExecutionFields({ ...before, ...data }));
    this.validateSignal(normalized);
    const after = await this.prisma.signal.update({
      where: { id },
      data: this.toUpdateInput(normalized),
    });
    await this.events.handleUpdate(before, after);
    return mapSignal(after);
  }

  async remove(id: string) {
    const signal = await this.prisma.signal.findUnique({ where: { id } });
    if (!signal) throw new NotFoundException('Signal not found');
    await this.prisma.signal.delete({ where: { id } });
    await this.events.handleDelete(id, signal.marketType);
    return { ok: true };
  }

  async removeMany(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required');
    }
    if (ids.length > 100) {
      throw new BadRequestException('Maximum 100 ids per batch');
    }
    const uniqueIds = [...new Set(ids.map((id) => String(id ?? '').trim()).filter(Boolean))];
    const signals = await this.prisma.signal.findMany({ where: { id: { in: uniqueIds } } });
    if (signals.length === 0) {
      throw new NotFoundException('No signals found');
    }
    await this.prisma.signal.deleteMany({ where: { id: { in: signals.map((s) => s.id) } } });
    for (const signal of signals) {
      await this.events.handleDelete(signal.id, signal.marketType);
    }
    return { ok: true, deleted: signals.length };
  }

  async findByExternalId(externalId: string) {
    const signal = await this.prisma.signal.findUnique({ where: { externalId } });
    if (!signal) throw new NotFoundException('Signal not found');
    return mapSignal(signal);
  }

  async upsertByExternalId(externalId: string, data: Record<string, unknown>) {
    const trimmed = String(externalId ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('externalId is required');
    }
    const existing = await this.prisma.signal.findUnique({ where: { externalId: trimmed } });
    if (existing) {
      return mapSignal(existing);
    }
    return this.create({ ...data, externalId: trimmed });
  }

  async updateByExternalId(externalId: string, data: Record<string, unknown>) {
    const trimmed = String(externalId ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('externalId is required');
    }
    const before = await this.prisma.signal.findUnique({ where: { externalId: trimmed } });
    if (!before) throw new NotFoundException('Signal not found');
    return this.update(before.id, data);
  }

  private validateSignal(data: Record<string, unknown>) {
    if (data.status === SignalStatus.CLOSED && !data.closeDate) {
      throw new BadRequestException('closeDate is required when status is CLOSED');
    }
    if (data.liquidated === true && data.status !== SignalStatus.CLOSED) {
      throw new BadRequestException('liquidated is only allowed when status is CLOSED');
    }
  }

  private toCreateInput(data: Record<string, unknown>): Prisma.SignalCreateInput {
    return {
      externalId: data.externalId as string | undefined,
      source: data.source as string | undefined,
      pair: data.pair as string,
      marketType: data.marketType as Prisma.SignalCreateInput['marketType'],
      direction: data.direction as Prisma.SignalCreateInput['direction'],
      action: data.action as string,
      entryPrice: new Prisma.Decimal((data.entryPrice as number) ?? 0),
      capitalPercentage: (data.capitalPercentage as number) ?? 1,
      leverage: data.leverage as number,
      openDate: new Date((data.openDate as string) ?? new Date().toISOString()),
      closeDate: data.closeDate ? new Date(data.closeDate as string) : null,
      status: (data.status as SignalStatus) ?? SignalStatus.OPEN,
      currentTpLevel: data.currentTpLevel as number,
      slHit: (data.slHit as boolean) ?? false,
      liquidated: data.liquidated === true ? true : false,
      targetHitLabel: data.targetHitLabel as string,
      profitPercentage: data.profitPercentage as number,
      positionSizeUsdt: data.positionSizeUsdt as number,
      realizedPnlUsdt: data.realizedPnlUsdt as number,
      logoUrl: data.logoUrl as string,
      details: data.details as Prisma.InputJsonValue,
    };
  }

  private toUpdateInput(data: Record<string, unknown>): Prisma.SignalUpdateInput {
    const input = normalizeSignalInput(data);
    if (data.liquidated === true) {
      input.slHit = false;
    }
    return input;
  }
}
