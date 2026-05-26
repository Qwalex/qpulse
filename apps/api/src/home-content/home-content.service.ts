import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const content = await this.prisma.homeContent.findUnique({ where: { id: 'default' } });
    if (!content) throw new NotFoundException('Home content not found');
    return {
      btcPrice: Number(content.btcPrice),
      btcChange24h: content.btcChange24h,
      btcMarketCap: content.btcMarketCap,
      btcVolume: content.btcVolume,
      fearGreedValue: content.fearGreedValue,
      fearGreedLabel: content.fearGreedLabel,
      ticker: content.ticker,
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
