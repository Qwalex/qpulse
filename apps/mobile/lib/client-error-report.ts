import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ClientErrorKind, type ClientErrorCreateDto } from '@qpulse/shared';
import { getApiBasePath } from '@/lib/api-base';
import { getDeviceId } from '@/lib/deviceId';

const REPORT_PATH = '/client-errors';
const DEDUPE_TTL_MS = 5 * 60_000;
const MAX_MESSAGE_LEN = 2000;
const MAX_STACK_LEN = 4000;

const recentReports = new Map<string, number>();

export type ReportClientErrorInput = {
  kind: ClientErrorKind;
  message: string;
  stack?: string;
  screen?: string;
  apiPath?: string;
};

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function shouldSkipReport(input: ReportClientErrorInput): boolean {
  const key = `${input.kind}:${input.apiPath ?? ''}:${input.screen ?? ''}:${input.message.slice(0, 120)}`;
  const now = Date.now();
  const last = recentReports.get(key);
  if (last != null && now - last < DEDUPE_TTL_MS) {
    return true;
  }
  recentReports.set(key, now);
  return false;
}

function resolveAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export async function reportClientError(input: ReportClientErrorInput): Promise<void> {
  if (input.apiPath === REPORT_PATH) {
    return;
  }
  if (shouldSkipReport(input)) {
    return;
  }

  let deviceId: string | undefined;
  try {
    deviceId = await getDeviceId();
  } catch {
    deviceId = undefined;
  }

  const payload: ClientErrorCreateDto = {
    kind: input.kind,
    message: truncate(input.message, MAX_MESSAGE_LEN),
    stack: input.stack ? truncate(input.stack, MAX_STACK_LEN) : undefined,
    screen: input.screen,
    apiPath: input.apiPath,
    deviceId,
    platform: Platform.OS,
    appVersion: resolveAppVersion(),
  };

  try {
    await fetch(`${getApiBasePath()}${REPORT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // reporting must never break the app
  }
}

export function reportRenderError(error: Error, screen?: string): void {
  void reportClientError({
    kind: ClientErrorKind.RENDER,
    message: error.message,
    stack: error.stack,
    screen,
  });
}

export function reportRequestError(
  kind: ClientErrorKind.NETWORK | ClientErrorKind.JSON,
  message: string,
  apiPath: string,
): void {
  void reportClientError({ kind, message, apiPath });
}
