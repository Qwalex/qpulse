import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const content = await this.prisma.homeContent.findUnique({ where: { id: 'default' } });
    if (!content) throw new NotFoundException('Home content not found');
    return {
      totalMarketCap: content.totalMarketCap,
      totalMarketCapChange24h: content.totalMarketCapChange24h,
      altcoinSeasonIndex: content.altcoinSeasonIndex,
      altcoinSeasonLabel: content.altcoinSeasonLabel,
      fearGreedValue: content.fearGreedValue,
      fearGreedLabel: content.fearGreedLabel,
      socialLinks: content.socialLinks,
    };
  }

  async update(data: Record<string, unknown>) {
    return this.prisma.homeContent.update({
      where: { id: 'default' },
      data: data as never,
    });
  }
}
