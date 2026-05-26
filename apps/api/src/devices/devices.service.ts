import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  register(data: { pushToken: string; platform: string; deviceId?: string }) {
    return this.prisma.deviceToken.upsert({
      where: { pushToken: data.pushToken },
      create: { ...data, isActive: true },
      update: { ...data, isActive: true },
    });
  }

  unregister(pushToken: string) {
    return this.prisma.deviceToken.updateMany({
      where: { pushToken },
      data: { isActive: false },
    });
  }
}
