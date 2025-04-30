import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { SharedModule } from '@shared/shared.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { CartsModule } from '@carts/carts.module';
import { TicketsModule } from '@tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    SharedModule,
    NotificationsModule,
    forwardRef(() => CartsModule),
    forwardRef(() => TicketsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository, OrderItemRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
