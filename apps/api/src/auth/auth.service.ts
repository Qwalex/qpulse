import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const user = await this.prisma.adminUser.findFirst({ where: { refreshTokenHash: hash } });
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    const newRefresh = randomBytes(32).toString('hex');
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { refreshTokenHash: createHash('sha256').update(newRefresh).digest('hex') },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { accessToken, refreshToken: newRefresh, user: { id: user.id, email: user.email } };
  }

  async logout(userId: string) {
    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email };
  }
}
