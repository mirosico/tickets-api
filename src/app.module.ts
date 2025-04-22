import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { CartsModule } from './carts/carts.module';
import { OrdersModule } from './orders/orders.module';
import { Concert } from './concerts/entities/concert.entity';
import { Ticket } from './tickets/entities/ticket.entity';
import { User } from './users/entities/user.entity';
import { Cart } from './carts/entities/cart.entity';
import { CartItem } from './carts/entities/cart-item.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { QueueItem } from './tickets/entities/queue-item.entity';
import { ConcertsModule } from './concerts/concerts.module';
import { AppController } from './app.controller';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'ticket_booking'),
        entities: [
          User,
          Concert,
          Ticket,
          Cart,
          CartItem,
          Order,
          OrderItem,
          QueueItem,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production', // Тільки для розробки!
      }),
    }),
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
  ],
  controllers: [AppController],
})
export class AppModule {}
