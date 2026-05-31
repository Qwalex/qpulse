import { Injectable, BadRequestException } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDeviceId(deviceId: string): Promise<Review | null> {
    return this.prisma.review.findUnique({ where: { deviceId } });
  }

  async upsert(data: { rating: number; comment?: string; deviceId?: string }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be 1-5');
    }

    if (!data.deviceId) {
      return this.prisma.review.create({
        data: {
          rating: data.rating,
          comment: data.comment ?? null,
        },
      });
    }

    return this.prisma.review.upsert({
      where: { deviceId: data.deviceId },
      create: {
        rating: data.rating,
        comment: data.comment ?? null,
        deviceId: data.deviceId,
      },
      update: {
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });
  }

  async list() {
    return this.prisma.review.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
