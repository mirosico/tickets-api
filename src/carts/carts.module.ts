import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';
import { SharedModule } from '@shared/shared.module';
import { NotificationsModule } from '@notifications/notifications.module';
import { TicketsModule } from '@tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      CartRepository,
      CartItemRepository,
    ]),
    SharedModule,
    NotificationsModule,
    forwardRef(() => TicketsModule),
  ],
  controllers: [CartsController],
  providers: [CartsService, CartRepository, CartItemRepository],
  exports: [CartsService, CartRepository, CartItemRepository],
})
export class CartsModule {}
