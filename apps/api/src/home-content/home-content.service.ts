import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapPublicHomeContent } from './home-content.mapper';

@Injectable()
export class HomeContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic() {
    const content = await this.prisma.homeContent.findUnique({ where: { id: 'default' } });
    if (!content) throw new NotFoundException('Home content not found');
    return mapPublicHomeContent(content);
  }

  async update(data: Record<string, unknown>) {
    return this.prisma.homeContent.update({
      where: { id: 'default' },
      data: data as never,
    });
  }
}
