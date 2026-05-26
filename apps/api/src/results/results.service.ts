import { Injectable, NotFoundException } from '@nestjs/common';
import { SignalStatus } from '@prisma/client';
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

    const summary = await this.prisma.resultsSummary.findUnique({
      where: { marketType_timeframe: { marketType, timeframe } },
    });
    if (!summary) throw new NotFoundException('Results summary not found');

    const signals = await this.prisma.signal.findMany({
      where: {
        marketType,
        status: SignalStatus.CLOSED,
        closeDate: { gte: since },
      },
      orderBy: { closeDate: 'desc' },
    });

    return {
      summary: {
        totalTrades: summary.totalTrades,
        winTrades: summary.winTrades,
        lossTrades: summary.lossTrades,
        winRate: summary.winRate,
        totalProfit: summary.totalProfit,
      },
      signals: signals.map(mapSignal),
    };
  }

  async listSummaries() {
    return this.prisma.resultsSummary.findMany();
  }

  async upsertSummary(data: Record<string, unknown>) {
    return this.prisma.resultsSummary.upsert({
      where: {
        marketType_timeframe: {
          marketType: data.marketType as never,
          timeframe: data.timeframe as never,
        },
      },
      create: data as never,
      update: data as never,
    });
  }

  async deleteSummary(marketType: string, timeframe: string) {
    return this.prisma.resultsSummary.delete({
      where: {
        marketType_timeframe: {
          marketType: parseMarketType(marketType) as never,
          timeframe: parseTimeframe(timeframe) as never,
        },
      },
    });
  }
}
