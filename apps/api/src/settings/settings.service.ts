import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.appSettings.findUnique({ where: { id: 'default' } });
    if (!settings) throw new NotFoundException('Settings not found');
    return {
      disclaimer: settings.disclaimer,
      telegramFabUrl: settings.telegramFabUrl,
    };
  }

  async getMenu() {
    return this.prisma.menuLink.findMany({
      where: { isEnabled: true },
      orderBy: { order: 'asc' },
    });
  }

  async listMenuLinks() {
    return this.prisma.menuLink.findMany({ orderBy: { order: 'asc' } });
  }

  async upsertMenuLink(data: Record<string, unknown>) {
    return this.prisma.menuLink.upsert({
      where: { id: data.id as string },
      create: data as never,
      update: data as never,
    });
  }

  async deleteMenuLink(id: string) {
    return this.prisma.menuLink.delete({ where: { id } });
  }

  async updateSettings(data: Record<string, unknown>) {
    return this.prisma.appSettings.update({
      where: { id: 'default' },
      data: data as never,
    });
  }
}
