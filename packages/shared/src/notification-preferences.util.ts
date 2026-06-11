import { MarketType } from './market-type';
import type { DeviceNotificationPreferencesDto } from './notification-preferences.types';

export const DEFAULT_DEVICE_NOTIFICATION_PREFERENCES: Omit<
  DeviceNotificationPreferencesDto,
  'deviceId'
> = {
  signalsNew: true,
  signalsTp: true,
  signalsSl: true,
  signalsLiquidation: true,
  signalsClosed: true,
  signalsUpdates: true,
  priceAlerts: true,
  spotEnabled: true,
  futuresEnabled: true,
};

function resolveMarketType(raw: unknown): MarketType | null {
  if (raw === MarketType.SPOT || raw === 'SPOT') return MarketType.SPOT;
  if (raw === MarketType.FUTURES || raw === 'FUTURES') return MarketType.FUTURES;
  return null;
}

export function mergeNotificationPreferences(
  deviceId: string,
  partial?: Partial<Omit<DeviceNotificationPreferencesDto, 'deviceId'>>,
): DeviceNotificationPreferencesDto {
  return { deviceId, ...DEFAULT_DEVICE_NOTIFICATION_PREFERENCES, ...partial };
}

export function shouldDeliverSignalPush(
  prefs: DeviceNotificationPreferencesDto,
  eventType: string,
  marketTypeRaw?: unknown,
): boolean {
  const marketType = resolveMarketType(marketTypeRaw);
  if (marketType === MarketType.SPOT && !prefs.spotEnabled) return false;
  if (marketType === MarketType.FUTURES && !prefs.futuresEnabled) return false;

  switch (eventType) {
    case 'SIGNAL_CREATED':
      return prefs.signalsNew;
    case 'TP_HIT':
      return prefs.signalsTp;
    case 'SL_HIT':
      return prefs.signalsSl;
    case 'LIQUIDATED':
      return prefs.signalsLiquidation;
    case 'SIGNAL_CLOSED':
      return prefs.signalsClosed;
    case 'SIGNAL_UPDATED':
    case 'SIGNAL_CANCELLED':
      return prefs.signalsUpdates;
    default:
      return true;
  }
}

export function shouldDeliverPriceAlertPush(prefs: DeviceNotificationPreferencesDto): boolean {
  return prefs.priceAlerts;
}
