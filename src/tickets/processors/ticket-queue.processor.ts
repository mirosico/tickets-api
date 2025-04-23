import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QUEUE_PROCESSOR, QUEUE_PROCESS_JOB } from '../tickets.constants';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { QueueItem, QueueStatus } from '../entities/queue-item.entity';
import { RedisService } from '@services/redis.service';
import { getErrorMessage, getLockKey, getQueueKey } from '@utils';
import { CartsService } from '@carts/carts.service';
import { NotificationsService } from '@notifications/notifications.service';

@Processor(QUEUE_PROCESSOR)
export class TicketQueueProcessor {
  private readonly logger = new Logger(TicketQueueProcessor.name);

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(QueueItem)
    private queueItemRepository: Repository<QueueItem>,
    private redisService: RedisService,
    private cartService: CartsService,
    private notificationService: NotificationsService,
  ) {}

  @Process(QUEUE_PROCESS_JOB)
  async processQueueItem(
    job: Job<{ queueItemId: string; userId: string; ticketId: string }>,
  ) {
    const { queueItemId, userId, ticketId } = job.data;
    this.logger.debug(`Обробка елемента черги: ${queueItemId}`);

    try {
      this.notificationService.sendQueueUpdate(
        job.data.userId,
        job.data.queueItemId,
        0, // Позиція 0 означає, що зараз обробляється
        QueueStatus.PROCESSING,
        job.data.ticketId,
      );
      // Оновлюємо статус елемента черги
      await this.queueItemRepository.update(
        { id: queueItemId },
        { status: QueueStatus.PROCESSING },
      );

      // Блокуємо квиток для атомарної операції
      const lockKey = getLockKey(ticketId);
      const lockAcquired = await this.redisService.setLock(lockKey, 10);

      if (!lockAcquired) {
        throw new Error('Квиток вже блоковано іншим процесом');
      }

      try {
        // Перевіряємо, чи квиток все ще в стані "в черзі"
        const ticket = await this.ticketRepository.findOne({
          where: { id: ticketId },
        });
        if (!ticket) {
          throw new Error('Квиток не знайдено');
        }

        if (ticket.status !== TicketStatus.IN_QUEUE) {
          throw new Error('Квиток більше не доступний для бронювання');
        }

        // Резервуємо квиток у кошику користувача
        await this.cartService.addTicketToCart(userId, ticketId);

        // Оновлюємо статус елемента черги
        await this.queueItemRepository.update(
          { id: queueItemId },
          { status: QueueStatus.COMPLETED },
        );

        this.notificationService.sendQueueUpdate(
          job.data.userId,
          job.data.queueItemId,
          0,
          QueueStatus.COMPLETED,
          job.data.ticketId,
        );

        this.logger.debug(`Елемент черги оброблено успішно: ${queueItemId}`);
      } finally {
        await this.redisService.del(getQueueKey(ticketId));
        await this.redisService.releaseLock(lockKey);
      }
    } catch (error: unknown) {
      this.logger.error(
        `Помилка при обробці елемента черги ${queueItemId}: ${getErrorMessage(error)}`,
      );

      // Оновлюємо статус елемента черги на "помилка"
      await this.queueItemRepository.update(
        { id: queueItemId },
        { status: QueueStatus.FAILED },
      );

      // Якщо сталася помилка, повертаємо квиток у доступний стан
      try {
        await this.ticketRepository.update(
          { id: ticketId },
          { status: TicketStatus.AVAILABLE },
        );
      } catch (updateError: unknown) {
        this.logger.error(
          `Помилка при оновленні статусу квитка ${ticketId}: ${getErrorMessage(updateError)}`,
        );
      }

      // Перекидаємо помилку для обробки в Bull
      throw error;
    }
  }
}
