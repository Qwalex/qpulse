import { Controller, Get, OnModuleDestroy } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@SkipThrottle()
@Controller('health')
export class HealthController implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.redis = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      maxRetriesPerRequest: 1,
    });
  }

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.ping();
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
