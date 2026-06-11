export interface DeviceNotificationPreferencesDto {
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
}

export interface DeviceNotificationPreferencesUpdateDto {
  deviceId: string;
  signalsNew?: boolean;
  signalsTp?: boolean;
  signalsSl?: boolean;
  signalsLiquidation?: boolean;
  signalsClosed?: boolean;
  signalsUpdates?: boolean;
  priceAlerts?: boolean;
  spotEnabled?: boolean;
  futuresEnabled?: boolean;
}

export type DeviceNotificationPreferenceKey = Exclude<
  keyof DeviceNotificationPreferencesDto,
  'deviceId'
>;
