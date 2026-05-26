import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { rating: number; comment?: string; deviceId?: string }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be 1-5');
    }
    if (data.deviceId) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await this.prisma.review.findFirst({
        where: { deviceId: data.deviceId, createdAt: { gte: since } },
      });
      if (existing) throw new BadRequestException('One review per device per 24h');
    }
    return this.prisma.review.create({ data });
  }

  async list() {
    return this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
