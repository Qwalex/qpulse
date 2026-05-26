import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';

import { SignalsModule } from './signals/signals.module';

import { ResultsModule } from './results/results.module';

import { HomeContentModule } from './home-content/home-content.module';

import { SettingsModule } from './settings/settings.module';

import { ReviewsModule } from './reviews/reviews.module';

import { DevicesModule } from './devices/devices.module';

import { AuthModule } from './auth/auth.module';

import { RealtimeModule } from './realtime/realtime.module';

import { QueueModule } from './queue/queue.module';

import { EventsModule } from './events/events.module';

import { NotificationsModule } from './notifications/notifications.module';

import { AdminModule } from './admin/admin.module';

import { HealthModule } from './health/health.module';



@Module({

  imports: [

    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([

      { name: 'default', ttl: 60_000, limit: 120 },

      { name: 'auth', ttl: 60_000, limit: 10 },

      { name: 'public-write', ttl: 60_000, limit: 20 },

    ]),

    PrismaModule,

    QueueModule,

    RealtimeModule,

    EventsModule,

    NotificationsModule,

    AuthModule,

    SignalsModule,

    ResultsModule,

    HomeContentModule,

    SettingsModule,

    ReviewsModule,

    DevicesModule,

    AdminModule,

    HealthModule,

  ],

  providers: [

    {

      provide: APP_GUARD,

      useClass: ThrottlerGuard,

    },

  ],

})

export class AppModule {}

