import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Ticket } from '@tickets/entities/ticket.entity';
import { CartItem } from '@carts/entities/cart-item.entity';
import { Cart } from '@carts/entities/cart.entity';
import { SharedModule } from '@shared/shared.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Ticket, Cart, CartItem]),
    SharedModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
