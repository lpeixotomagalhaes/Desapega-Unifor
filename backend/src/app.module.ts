import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SavedItemsModule } from './saved-items/saved-items.module';
import { StatsModule } from './stats/stats.module';
import { SupportModule } from './support/support.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite geral (aplicado a toda a API); rotas de auth têm limites mais
    // apertados via @Throttle (ver auth.controller.ts).
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),
    PrismaModule,
    AuthModule,
    ItemsModule,
    NotificationsModule,
    UploadsModule,
    StatsModule,
    AdminModule,
    SupportModule,
    ReviewsModule,
    UsersModule,
    SavedItemsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
