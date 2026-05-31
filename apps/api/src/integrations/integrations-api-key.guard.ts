import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import {
  INTEGRATIONS_API_KEY_ENV,
  INTEGRATIONS_API_KEY_HEADER,
} from './integrations.constants';

@Injectable()
export class IntegrationsApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = String(this.config.get<string>(INTEGRATIONS_API_KEY_ENV) ?? '').trim();
    if (!expected) {
      throw new UnauthorizedException('Integration API is not configured');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const provided = String(req.headers[INTEGRATIONS_API_KEY_HEADER] ?? '').trim();
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
