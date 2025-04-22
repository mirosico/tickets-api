import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { RedisService } from '../shared/services/redis.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private redisService: RedisService,
    private dataSource: DataSource,
  ) {}

  async findAllForUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.ticket'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.ticket'],
    });

    if (!order) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }

    return order;
  }

  async createFromCart(userId: string): Promise<Order> {
    // Знаходимо кошик користувача
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.ticket'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Кошик порожній');
    }

    // Розпочинаємо транзакцію
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Перевіряємо, чи всі елементи кошика мають дійсну резервацію
      const now = new Date();
      const expiredItems = cart.items.filter(
        (item) => item.reservedUntil < now,
      );

      if (expiredItems.length > 0) {
        throw new BadRequestException(
          'Деякі квитки мають прострочену резервацію',
        );
      }

      // Створюємо нове замовлення
      const totalAmount = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.ticket.price.toString()),
        0,
      );

      const order = this.orderRepository.create({
        userId,
        status: OrderStatus.PENDING,
        totalAmount,
      });

      await queryRunner.manager.save(order);

      // Створюємо елементи замовлення
      for (const cartItem of cart.items) {
        const orderItem = this.orderItemRepository.create({
          orderId: order.id,
          ticketId: cartItem.ticketId,
          price: cartItem.ticket.price,
        });

        await queryRunner.manager.save(orderItem);

        // Змінюємо статус квитка на проданий
        await queryRunner.manager.update(
          Ticket,
          { id: cartItem.ticketId },
          { status: TicketStatus.SOLD },
        );

        // Видаляємо інформацію про резервацію з Redis
        await this.redisService.del(`reservation:${cartItem.ticketId}`);
      }

      // Очищаємо кошик
      await queryRunner.manager.remove(cart.items);

      // Підтверджуємо транзакцію
      await queryRunner.commitTransaction();

      // Повертаємо створене замовлення
      return this.findOne(order.id, userId);
    } catch (error) {
      // Відкочуємо транзакцію у разі помилки
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Звільняємо ресурси
      await queryRunner.release();
    }
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Можна скасувати тільки замовлення в статусі "очікування оплати"',
      );
    }

    // Розпочинаємо транзакцію
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Змінюємо статус замовлення
      order.status = OrderStatus.CANCELLED;
      await queryRunner.manager.save(order);

      // Повертаємо квитки назад у продаж
      for (const orderItem of order.items) {
        await queryRunner.manager.update(
          Ticket,
          { id: orderItem.ticketId },
          { status: TicketStatus.AVAILABLE },
        );
      }

      // Підтверджуємо транзакцію
      await queryRunner.commitTransaction();

      return order;
    } catch (error) {
      // Відкочуємо транзакцію у разі помилки
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Звільняємо ресурси
      await queryRunner.release();
    }
  }

  async completePayment(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Замовлення з ID ${id} не знайдено`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Неможливо оплатити замовлення в поточному статусі',
      );
    }

    // Тут буде код для обробки оплати через платіжну систему
    // Для прототипу просто змінюємо статус замовлення

    order.status = OrderStatus.PAID;
    return this.orderRepository.save(order);
  }
}
