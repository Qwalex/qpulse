import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class NotificationsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('notification-templates')
  listTemplates() {
    return this.prisma.notificationTemplate.findMany();
  }

  @Patch('notification-templates/:eventType')
  updateTemplate(@Param('eventType') eventType: string, @Body() body: Record<string, unknown>) {
    return this.prisma.notificationTemplate.update({
      where: { eventType: eventType as never },
      data: body as never,
    });
  }

  @Get('notifications/log')
  listLogs() {
    return this.prisma.notificationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
