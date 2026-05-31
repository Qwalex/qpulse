import { BadRequestException, Injectable } from '@nestjs/common';
import { ClientErrorKind, Prisma } from '@prisma/client';
import { ClientErrorReportDto } from '@qpulse/shared';
import { PrismaService } from '../prisma/prisma.service';

const MAX_MESSAGE_LEN = 2000;
const MAX_STACK_LEN = 8000;
const MAX_SCREEN_LEN = 256;
const MAX_API_PATH_LEN = 256;
const MAX_DEVICE_ID_LEN = 128;
const MAX_PLATFORM_LEN = 32;
const MAX_APP_VERSION_LEN = 32;

const ALLOWED_KINDS = new Set<string>(Object.values(ClientErrorKind));

function truncate(value: string | undefined, max: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function mapReport(row: {
  id: string;
  kind: ClientErrorKind;
  message: string;
  stack: string | null;
  screen: string | null;
  apiPath: string | null;
  deviceId: string | null;
  platform: string | null;
  appVersion: string | null;
  createdAt: Date;
}): ClientErrorReportDto {
  return {
    id: row.id,
    kind: row.kind as ClientErrorReportDto['kind'],
    message: row.message,
    stack: row.stack,
    screen: row.screen,
    apiPath: row.apiPath,
    deviceId: row.deviceId,
    platform: row.platform,
    appVersion: row.appVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ClientErrorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: Record<string, unknown>) {
    const kindRaw = String(body.kind ?? '').trim();
    if (!ALLOWED_KINDS.has(kindRaw)) {
      throw new BadRequestException('Invalid error kind');
    }

    const message = truncate(String(body.message ?? ''), MAX_MESSAGE_LEN);
    if (!message) {
      throw new BadRequestException('message is required');
    }

    const data: Prisma.ClientErrorReportCreateInput = {
      kind: kindRaw as ClientErrorKind,
      message,
      stack: truncate(typeof body.stack === 'string' ? body.stack : undefined, MAX_STACK_LEN) ?? null,
      screen: truncate(typeof body.screen === 'string' ? body.screen : undefined, MAX_SCREEN_LEN) ?? null,
      apiPath: truncate(typeof body.apiPath === 'string' ? body.apiPath : undefined, MAX_API_PATH_LEN) ?? null,
      deviceId: truncate(typeof body.deviceId === 'string' ? body.deviceId : undefined, MAX_DEVICE_ID_LEN) ?? null,
      platform: truncate(typeof body.platform === 'string' ? body.platform : undefined, MAX_PLATFORM_LEN) ?? null,
      appVersion:
        truncate(typeof body.appVersion === 'string' ? body.appVersion : undefined, MAX_APP_VERSION_LEN) ??
        null,
    };

    const created = await this.prisma.clientErrorReport.create({ data });
    return { ok: true as const, id: created.id };
  }

  async list(limitRaw?: number) {
    const limit = Math.min(Math.max(Number(limitRaw) || 100, 1), 500);
    const rows = await this.prisma.clientErrorReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapReport);
  }
}
