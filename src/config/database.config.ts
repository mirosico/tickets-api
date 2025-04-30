import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '@users/entities/user.entity';
import { Concert } from '@concerts/entities/concert.entity';
import { Ticket } from '@tickets/entities/ticket.entity';
import { Cart } from '@carts/entities/cart.entity';
import { CartItem } from '@carts/entities/cart-item.entity';
import { Order } from '@orders/entities/order.entity';
import { OrderItem } from '@orders/entities/order-item.entity';
import { QueueItem } from '@tickets/entities/queue-item.entity';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const baseConfig = {
      type: 'postgres' as const,
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_DATABASE', 'ticket_booking'),
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
      synchronize: !isProduction,
    };

    return {
      type: 'postgres' as const,
      replication: {
        master: {
          ...baseConfig,
          port: 5440, // HAProxy write port
        },
        slaves: [
          {
            ...baseConfig,
            port: 5441, // HAProxy read port
          },
        ],
      },
      entities: baseConfig.entities,
      synchronize: baseConfig.synchronize,
    };
  }
}
