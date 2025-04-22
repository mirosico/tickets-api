import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { QueueStatus } from '../tickets/entities/queue-item.entity';
import { TicketStatus } from '../tickets/entities/ticket.entity';
import { getErrorMessage, getTimeLeft } from '../shared/utils';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  sendQueueUpdate(
    userId: string,
    queueItemId: string,
    position: number,
    status: QueueStatus,
    ticketId: string,
  ) {
    try {
      this.notificationsGateway.sendToUser(userId, {
        event: 'queue_update',
        data: {
          queueItemId,
          position,
          status,
          ticketId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Помилка при надсиланні оновлення черги: ${getErrorMessage(error)}`,
      );
    }
  }

  sendReservationUpdate(
    userId: string,
    ticketId: string,
    cartItemId: string,
    reservedUntil: Date,
    status: TicketStatus,
  ) {
    try {
      const timeLeft = getTimeLeft(reservedUntil);

      this.notificationsGateway.sendToUser(userId, {
        event: 'reservation_update',
        data: {
          ticketId,
          cartItemId,
          status,
          reservedUntil: reservedUntil.toISOString(),
          timeLeft,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Помилка при надсиланні оновлення резервації: ${getErrorMessage(error)}`,
      );
    }
  }

  sendReservationExpired(userId: string, ticketId: string, cartItemId: string) {
    try {
      this.notificationsGateway.sendToUser(userId, {
        event: 'reservation_expired',
        data: {
          ticketId,
          cartItemId,
          message: 'Час резервації квитка закінчився',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Помилка при надсиланні сповіщення про закінчення резервації: ${getErrorMessage(error)}`,
      );
    }
  }

  sendOrderStatusUpdate(userId: string, orderId: string, status: string) {
    try {
      this.notificationsGateway.sendToUser(userId, {
        event: 'order_status',
        data: {
          orderId,
          status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Помилка при надсиланні оновлення статусу замовлення: ${getErrorMessage(error)}`,
      );
    }
  }

  sendTicketAddedToCart(userId: string, ticketId: string, cartItemId: string) {
    try {
      this.notificationsGateway.sendToUser(userId, {
        event: 'ticket_added_to_cart',
        data: {
          ticketId,
          cartItemId,
          message: 'Квиток успішно додано до кошика',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Помилка при надсиланні сповіщення про додавання квитка: ${getErrorMessage(error)}`,
      );
    }
  }

  broadcastTicketAvailabilityChange(concertId: string, availableCount: number) {
    try {
      this.notificationsGateway.broadcastToAll({
        event: 'ticket_availability',
        data: {
          concertId,
          availableCount,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Помилка при надсиланні сповіщення про доступність квитків: ${getErrorMessage(error)}`,
      );
    }
  }
}
