import { Injectable } from '@nestjs/common';
import { SignalStatus } from '@prisma/client';
import { computeResultsSummary } from '@qpulse/shared';
import { PrismaService } from '../prisma/prisma.service';
import { mapSignal } from '../common/mappers/signal.mapper';
import { parseMarketType, parseTimeframe, timeframeStartDate } from '../common/utils/query-params';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async getResults(marketTypeRaw: string, timeframeRaw?: string) {
    const marketType = parseMarketType(marketTypeRaw);
    const timeframe = parseTimeframe(timeframeRaw);
    const since = timeframeStartDate(timeframe);

    const signals = await this.prisma.signal.findMany({
      where: {
        marketType,
        status: SignalStatus.CLOSED,
        closeDate: { gte: since },
      },
      orderBy: { closeDate: 'desc' },
    });

    const mapped = signals.map(mapSignal);
    return {
      summary: computeResultsSummary(mapped),
      signals: mapped,
    };
  }
}
