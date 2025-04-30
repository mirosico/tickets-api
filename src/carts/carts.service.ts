import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { TicketStatus } from '@tickets/entities/ticket.entity';
import { RedisService } from '@services/redis.service';
import {
  getError,
  getErrorMessage,
  getLockKey,
  getReservationKey,
  getTimeLeft,
} from '@utils';
import { reservationSchema } from '@schemas/reservationSchema';
import { NotificationsService } from '@notifications/notifications.service';
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';
import { TicketRepository } from '@tickets/repositories/ticket.repository';

export interface CartItemWithTimeLeft extends CartItem {
  timeLeft: number;
}

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);
  private readonly RESERVATION_DURATION = 1 * 60; // 15 minutes

  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly cartRepository: CartRepository,
    private readonly cartItemRepository: CartItemRepository,
  ) {}

  async getUserActiveCart(userId: string): Promise<Cart | null> {
    return this.cartRepository.findUserActiveCart(userId);
  }

  async createCart(userId: string): Promise<Cart> {
    return this.cartRepository.createCart(userId);
  }

  async addItemToCart(cartId: string, ticketId: string): Promise<void> {
    const cart = await this.cartRepository.findOneReadOnly({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    const existingItem = cart.items.find((item) => item.ticketId === ticketId);
    if (!existingItem) {
      await this.cartItemRepository.saveWrite({
        cartId,
        ticketId,
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes reservation
      });
    }
  }

  async removeItemFromCart(cartId: string, ticketId: string): Promise<void> {
    const cart = await this.cartRepository.findOneReadOnly({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    const itemToRemove = cart.items.find((item) => item.ticketId === ticketId);
    if (itemToRemove) {
      await this.cartItemRepository.delete(itemToRemove.id);
    }
  }

  async clearCart(cartId: string): Promise<void> {
    const cart = await this.cartRepository.findOneReadOnly({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    await Promise.all(
      cart.items.map((item) => this.cartItemRepository.delete(item.id)),
    );
  }

  async getCartWithItems(cartId: string): Promise<Cart> {
    return this.cartRepository.getCartWithItems(cartId);
  }

  // Додає квиток у кошик користувача з тимчасовою резервацією
  async addTicketToCart(userId: string, ticketId: string): Promise<CartItem> {
    // Отримуємо або створюємо кошик користувача
    let cart = await this.cartRepository.findOne({ where: { userId } });
    if (!cart) {
      cart = this.cartRepository.create({ userId });
      await this.cartRepository.save(cart);
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

      this.notificationsService.sendTicketAddedToCart(
        userId,
        ticketId,
        cartItem.id,
      );

      this.notificationsService.sendReservationUpdate(
        userId,
        ticketId,
        cartItem.id,
        cartItem.reservedUntil,
        TicketStatus.RESERVED,
      );

      return cartItem;
    } catch (e: unknown) {
      throw getError(e);
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
      throw new NotFoundException('Cart not found');
    }

    // Перевіряємо, чи елемент належить до кошика користувача
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cartId: cart.id },
      relations: ['ticket'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Блокуємо квиток для атомарної операції
    const lockKey = getLockKey(cartItem.ticketId);
    const lockAcquired = await this.redisService.setLock(lockKey, 10);

    if (!lockAcquired) {
      throw new Error('Ticket is being processed by another request');
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
      .leftJoinAndSelect('cartItem.cart', 'cart')
      .getMany();

    for (const item of expiredItems) {
      this.notificationsService.sendReservationExpired(
        item.cart.userId,
        item.ticketId,
        item.id,
      );
      const lockKey = getLockKey(item.ticketId);
      const lockAcquired = await this.redisService.setLock(lockKey, 10);

      if (!lockAcquired) {
        this.logger.warn(
          `Не вдалося отримати блокування для квитка ${item.ticketId}`,
        );
        continue;
      }

      try {
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
        await this.redisService.releaseLock(lockKey);
      }
    }

    return processedCount;
  }
}
