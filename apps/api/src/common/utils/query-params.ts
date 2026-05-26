import { BadRequestException } from '@nestjs/common';
import { MarketType, ResultsTimeframe, SignalStatus } from '@prisma/client';
import { TIMEFRAME_API_MAP } from '@qpulse/shared';

export function parseMarketType(value?: string): MarketType {
  if (!value) {
    throw new BadRequestException('marketType is required');
  }
  const map: Record<string, MarketType> = {
    spot: MarketType.SPOT,
    futures: MarketType.FUTURES,
    SPOT: MarketType.SPOT,
    FUTURES: MarketType.FUTURES,
  };
  const parsed = map[value.toLowerCase()];
  if (!parsed) {
    throw new BadRequestException('Invalid marketType');
  }
  return parsed;
}

export function parseTimeframe(value?: string): ResultsTimeframe {
  const tf = value ?? '3M';
  const parsed = TIMEFRAME_API_MAP[tf.toUpperCase()];
  if (!parsed) {
    throw new BadRequestException('Invalid timeframe');
  }
  return parsed as ResultsTimeframe;
}

export function parseLiveStatus(value?: string): SignalStatus[] {
  const map: Record<string, SignalStatus[]> = {
    live: [SignalStatus.OPEN, SignalStatus.ACTIVE],
    open: [SignalStatus.OPEN],
    active: [SignalStatus.ACTIVE],
  };
  const key = (value ?? 'live').toLowerCase();
  const statuses = map[key];
  if (!statuses) {
    throw new BadRequestException('Invalid status');
  }
  return statuses;
}

export function parseAdminStatus(value?: string): SignalStatus | undefined {
  if (!value) return undefined;
  const map: Record<string, SignalStatus> = {
    open: SignalStatus.OPEN,
    active: SignalStatus.ACTIVE,
    closed: SignalStatus.CLOSED,
    cancelled: SignalStatus.CANCELLED,
  };
  const parsed = map[value.toLowerCase()];
  if (!parsed) {
    throw new BadRequestException('Invalid status');
  }
  return parsed;
}

export function timeframeStartDate(timeframe: ResultsTimeframe): Date {
  const days: Record<ResultsTimeframe, number> = {
    [ResultsTimeframe.ONE_W]: 7,
    [ResultsTimeframe.ONE_M]: 30,
    [ResultsTimeframe.THREE_M]: 90,
    [ResultsTimeframe.SIX_M]: 180,
    [ResultsTimeframe.ONE_Y]: 365,
  };
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days[timeframe]);
  return date;
}
