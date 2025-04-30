import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '@carts/entities/cart.entity';
import { CartItem } from '@carts/entities/cart-item.entity';
import { Ticket, TicketStatus } from '@tickets/entities/ticket.entity';
import { RedisService } from '@services/redis.service';
import { getReservationKey } from '@utils';
import { NotificationsService } from '@notifications/notifications.service';
import { OrderRepository } from './repositories/order.repository';
import { OrderItemRepository } from './repositories/order-item.repository';
import { CartRepository } from '@carts/repositories/cart.repository';
import { CartItemRepository } from '@carts/repositories/cart-item.repository';
import { TicketRepository } from '@tickets/repositories/ticket.repository';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly ticketRepository: TicketRepository,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async findAllForUser(userId: string): Promise<Order[]> {
    return this.orderRepository.findUserOrders(userId);
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOneReadOnly({
      where: { id, userId },
      relations: ['items', 'items.ticket'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async createFromCart(userId: string): Promise<Order> {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.ticket'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const expiredItems = cart.items.filter(
        (item) => item.reservedUntil < now,
      );

      if (expiredItems.length > 0) {
        throw new BadRequestException('Some tickets have expired reservations');
      }

      const totalAmount = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.ticket.price.toString()),
        0,
      );

      const order = await this.orderRepository.createOrder({
        userId,
        totalAmount,
      });

      const orderItems = cart.items.map((cartItem) => ({
        orderId: order.id,
        ticketId: cartItem.ticketId,
        price: cartItem.ticket.price,
      }));

      await this.orderItemRepository.createOrderItems(orderItems);

      for (const cartItem of cart.items) {
        await queryRunner.manager.update(
          Ticket,
          { id: cartItem.ticketId },
          { status: TicketStatus.SOLD },
        );

        await this.redisService.del(getReservationKey(cartItem.ticketId));
      }

      await queryRunner.manager.remove(cart.items);
      await queryRunner.commitTransaction();

      this.notificationsService.sendOrderStatusUpdate(
        userId,
        order.id,
        order.status,
      );

      return this.findOne(order.id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'You can only cancel orders in the "pending" status',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.orderRepository.cancelOrder(order.id);

      for (const orderItem of order.items) {
        await queryRunner.manager.update(
          Ticket,
          { id: orderItem.ticketId },
          { status: TicketStatus.AVAILABLE },
        );
      }

      await queryRunner.commitTransaction();

      return this.findOne(id, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completePayment(id: string): Promise<Order> {
    const order = await this.orderRepository.findOneReadOnly({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'You cannot pay for an order in the current status',
      );
    }

    await this.orderRepository.updateOrderStatus(id, OrderStatus.PAID);
    return this.findOne(id, order.userId);
  }
}
