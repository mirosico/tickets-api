import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { RedisService } from '../shared/services/redis.service';
import {
  getErrorMessage,
  getLockKey,
  getReservationKey,
  getTimeLeft,
} from 'src/shared/utils';
import { reservationSchema } from '../shared/schemas/reservationSchema';

export interface CartItemWithTimeLeft extends CartItem {
  timeLeft: number;
}

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);
  private readonly RESERVATION_DURATION = 15 * 60; // 15 хвилин

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private redisService: RedisService,
  ) {}

  // Додає квиток у кошик користувача з тимчасовою резервацією
  async addTicketToCart(userId: string, ticketId: string): Promise<CartItem> {
    // Отримуємо або створюємо кошик користувача
    let cart = await this.cartRepository.findOne({ where: { userId } });
    if (!cart) {
      cart = this.cartRepository.create({ userId });
      await this.cartRepository.save(cart);
    }

    // Блокуємо квиток для атомарної операції
    const lockKey = getLockKey(ticketId);
    const lockAcquired = await this.redisService.setLock(
      getLockKey(ticketId),
      10,
    );

    if (!lockAcquired) {
      throw new Error('Квиток зараз обробляється іншим запитом');
    }

    try {
      // Перевіряємо статус квитка
      const ticket = await this.ticketRepository.findOne({
        where: { id: ticketId },
      });
      if (!ticket) {
        throw new Error('Квиток не знайдено');
      }

      if (
        ticket.status !== TicketStatus.AVAILABLE &&
        ticket.status !== TicketStatus.IN_QUEUE
      ) {
        throw new Error('Квиток недоступний для бронювання');
      }

      // Розраховуємо час закінчення резервації
      const now = new Date();
      const reservedUntil = new Date(
        now.getTime() + this.RESERVATION_DURATION * 1000,
      );

      // Оновлюємо статус квитка
      ticket.status = TicketStatus.RESERVED;
      await this.ticketRepository.save(ticket);

      // Створюємо запис у кошику
      const cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        ticketId,
        reservedUntil,
      });

      await this.cartItemRepository.save(cartItem);

      // Зберігаємо інформацію про резервацію в Redis для швидкого доступу
      await this.redisService.set(
        getReservationKey(ticketId),
        JSON.stringify({
          cartItemId: cartItem.id,
          userId,
          reservedUntil: reservedUntil.toISOString(),
        }),
        this.RESERVATION_DURATION,
      );

      return cartItem;
    } finally {
      // Знімаємо блокування
      await this.redisService.releaseLock(lockKey);
    }
  }

  // Отримує вміст кошика користувача
  async getCart(
    userId: string,
  ): Promise<{ cart: Cart | null; items: CartItemWithTimeLeft[] }> {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.ticket'],
    });

    if (!cart) {
      return { cart: null, items: [] };
    }

    // Отримуємо актуальний час резервації для кожного квитка
    const items = await Promise.all(
      cart.items.map(async (item) => {
        const reservationData = await this.redisService.get(
          getReservationKey(item.ticketId),
        );

        let timeLeft = 0;
        if (reservationData) {
          const reservation = reservationSchema.parse(
            JSON.parse(reservationData),
          );

          const reservedUntil = new Date(reservation.reservedUntil);
          timeLeft = getTimeLeft(reservedUntil);
        }

        return {
          ...item,
          timeLeft,
        };
      }),
    );

    return { cart, items };
  }

  // Видалення елемента з кошика
  async removeFromCart(userId: string, cartItemId: string): Promise<boolean> {
    // Знаходимо кошик користувача
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      throw new Error('Кошик не знайдено');
    }

    // Перевіряємо, чи елемент належить до кошика користувача
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cartId: cart.id },
      relations: ['ticket'],
    });

    if (!cartItem) {
      throw new Error('Елемент кошика не знайдено');
    }

    // Блокуємо квиток для атомарної операції
    const lockKey = getLockKey(cartItem.ticketId);
    const lockAcquired = await this.redisService.setLock(lockKey, 10);

    if (!lockAcquired) {
      throw new Error('Квиток зараз обробляється іншим запитом');
    }

    try {
      await this.ticketRepository.update(
        { id: cartItem.ticketId },
        { status: TicketStatus.AVAILABLE },
      );

      await this.cartItemRepository.remove(cartItem);

      await this.redisService.del(getReservationKey(cartItem.ticketId));

      return true;
    } finally {
      // Знімаємо блокування
      await this.redisService.releaseLock(lockKey);
    }
  }

  // Обробка прострочених резервацій
  async processExpiredReservations(): Promise<number> {
    const now = new Date();
    let processedCount = 0;

    // Знаходимо всі прострочені елементи кошика
    const expiredItems = await this.cartItemRepository
      .createQueryBuilder('cartItem')
      .where('cartItem.reservedUntil < :now', { now })
      .leftJoinAndSelect('cartItem.ticket', 'ticket')
      .getMany();

    for (const item of expiredItems) {
      // Блокуємо квиток для атомарної операції
      const lockKey = getLockKey(item.ticketId);
      const lockAcquired = await this.redisService.setLock(lockKey, 10);

      if (!lockAcquired) {
        this.logger.warn(
          `Не вдалося отримати блокування для квитка ${item.ticketId}`,
        );
        continue;
      }

      try {
        // Оновлюємо статус квитка назад на "доступний"
        await this.ticketRepository.update(
          { id: item.ticketId },
          { status: TicketStatus.AVAILABLE },
        );

        await this.cartItemRepository.remove(item);
        await this.redisService.del(getReservationKey(item.ticketId));

        processedCount++;
      } catch (error: unknown) {
        this.logger.error(
          `Помилка при обробці простроченої резервації ${item.id}: ${getErrorMessage(error)}`,
        );
      } finally {
        // Знімаємо блокування
        await this.redisService.releaseLock(lockKey);
      }
    }

    return processedCount;
  }
}
