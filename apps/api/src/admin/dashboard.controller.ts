import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SignalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('admin/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async stats() {
    const [live, closed, cancelled, reviews, logs] = await Promise.all([
      this.prisma.signal.count({ where: { status: { in: [SignalStatus.OPEN, SignalStatus.ACTIVE] } } }),
      this.prisma.signal.count({ where: { status: SignalStatus.CLOSED } }),
      this.prisma.signal.count({ where: { status: SignalStatus.CANCELLED } }),
      this.prisma.review.count(),
      this.prisma.notificationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    return { live, closed, cancelled, pendingReviews: reviews, recentPushEvents: logs };
  }
}
