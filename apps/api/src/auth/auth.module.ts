import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';

import { AuthController } from './auth.controller';

import { JwtStrategy } from './jwt.strategy';



function resolveJwtSecret(config: ConfigService): string {

  const secret = config.get<string>('JWT_SECRET');

  if (process.env.NODE_ENV === 'production') {

    if (!secret || secret === 'dev-secret' || secret === 'dev-jwt-secret-change-in-production') {

      throw new Error('JWT_SECRET must be set to a strong value in production');

    }

    return secret;

  }

  return secret ?? 'dev-secret';

}



@Module({

  imports: [

    PassportModule,

    JwtModule.registerAsync({

      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({

        secret: resolveJwtSecret(config),

        signOptions: { expiresIn: '15m' },

      }),

    }),

  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],

  exports: [AuthService],

})

export class AuthModule {}

