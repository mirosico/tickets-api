import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@services/redis.service';
import { getErrorMessage, getReservationKeys, getTimeLeft } from '@utils';
import { ConfigService } from '@nestjs/config';
import { reservationSchema } from '@schemas/reservationSchema';

interface AuthenticatedClient extends WebSocket {
  userId: string;
}

@WebSocketGateway({
  path: '/ws/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients: Map<string, AuthenticatedClient[]> = new Map();
  private readonly logger = new Logger(NotificationsGateway.name);
  private pingInterval: NodeJS.Timeout;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: WebSocket, request: Request) {
    try {
      const url = new URL(request.url, this.configService.get('BASE_URL'));
      const token = url.searchParams.get('token');

      if (!token) {
        client.close(1008, 'Відсутній токен авторизації');
        return;
      }

      // TODO: jwt

      const authenticatedClient = client as AuthenticatedClient;
      const userId = 'userId'; // Отримати userId з токена JWT
      authenticatedClient.userId = userId;

      // Зберігаємо клієнта у мапі
      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }
      this.clients.get(userId)?.push(authenticatedClient);

      this.logger.log(`Клієнт підключений: ${userId}`);

      client.send(
        JSON.stringify({
          event: 'connected',
          data: { message: 'Успішне підключення до сервера нотифікацій' },
        }),
      );

      await this.sendActiveReservations(userId);
    } catch (error) {
      this.logger.error(
        `Помилка підключення веб-сокета: ${getErrorMessage(error)}`,
      );
      client.close(1011, "Помилка при встановленні з'єднання");
    }
  }

  handleDisconnect(client: AuthenticatedClient) {
    try {
      const userId = client.userId;
      if (userId && this.clients.has(userId)) {
        const clients = this.clients.get(userId)?.filter((c) => c !== client);
        if (!clients) {
          this.logger.error(`Клієнти не знайдені для користувача ${userId}`);
          return;
        }
        if (clients.length === 0) {
          this.clients.delete(userId);
        } else {
          this.clients.set(userId, clients);
        }
        this.logger.log(`Клієнт відключений: ${userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Помилка відключення веб-сокета: ${getErrorMessage(error)}`,
      );
    }
  }

  private async sendActiveReservations(userId: string) {
    try {
      // Отримуємо всі активні резервації користувача з Redis
      const keys = await this.redisService.keys(getReservationKeys());

      for (const key of keys) {
        const data = await this.redisService.get(key);
        if (!data) {
          return;
        }
        const reservation = reservationSchema.parse(JSON.parse(data));
        if (reservation.userId === userId) {
          const ticketId = key.split(':')[1];
          const reservedUntil = new Date(reservation.reservedUntil);
          const timeLeft = getTimeLeft(reservedUntil);

          // Надсилаємо інформацію про активну резервацію
          this.sendToUser(userId, {
            event: 'reservation_status',
            data: {
              ticketId,
              cartItemId: reservation.cartItemId,
              reservedUntil: reservation.reservedUntil,
              timeLeft,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Помилка при отриманні активних резервацій: ${getErrorMessage(error)}`,
      );
    }
  }

  @SubscribeMessage('subscribe_queue')
  handleSubscribeQueue(
    client: AuthenticatedClient,
    payload: { queueItemId: string },
  ) {
    try {
      this.logger.log(
        `Користувач ${client.userId} підписався на оновлення черги ${payload.queueItemId}`,
      );

      // Зберігаємо інформацію про підписку (можна використовувати Redis для цього)
      // Це дозволить відправляти оновлення статусу черги

      return { event: 'subscribe_queue', data: { success: true } };
    } catch (error) {
      throw new WsException(getErrorMessage(error));
    }
  }

  @SubscribeMessage('subscribe_cart')
  handleSubscribeCart(client: AuthenticatedClient) {
    try {
      this.logger.log(
        `Користувач ${client.userId} підписався на оновлення кошика`,
      );

      // Зберігаємо інформацію про підписку

      return { event: 'subscribe_cart', data: { success: true } };
    } catch (error) {
      throw new WsException(getErrorMessage(error));
    }
  }

  sendToUser(userId: string, message: any) {
    if (this.clients.has(userId)) {
      const clients = this.clients.get(userId);
      if (!clients) {
        this.logger.error(`Клієнти не знайдені для користувача ${userId}`);
        return;
      }
      const messageStr = JSON.stringify(message);

      for (const client of clients) {
        client.send(messageStr);
      }
    }
  }

  broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);

    for (const clients of this.clients.values()) {
      for (const client of clients) {
        client.send(messageStr);
      }
    }
  }

  onModuleDestroy() {
    clearInterval(this.pingInterval);
  }
}
