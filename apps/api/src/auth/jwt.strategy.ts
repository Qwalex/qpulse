import { Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';



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



@Injectable()

export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(config: ConfigService) {

    super({

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      secretOrKey: resolveJwtSecret(config),

    });

  }



  validate(payload: { sub: string; email: string }) {

    return { userId: payload.sub, email: payload.email };

  }

}

