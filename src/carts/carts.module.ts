import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartsController } from './carts.controller';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Ticket } from '@tickets/entities/ticket.entity';
import { SharedModule } from '@shared/shared.module';
import { CartsService } from './carts.service';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Ticket]),
    SharedModule,
    NotificationsModule,
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
