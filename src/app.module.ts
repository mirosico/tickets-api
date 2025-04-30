import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { TicketsModule } from '@tickets/tickets.module';
import { UsersModule } from '@users/users.module';
import { CartsModule } from '@carts/carts.module';
import { OrdersModule } from '@orders/orders.module';
import { ConcertsModule } from '@concerts/concerts.module';
import { AppController } from './app.controller';
import { NotificationsModule } from '@notifications/notifications.module';
import { SharedModule } from '@shared/shared.module';
import { AuthModule } from '@auth/auth.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    ConcertsModule,
    TicketsModule,
    CartsModule,
    OrdersModule,
    NotificationsModule,
    SharedModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
