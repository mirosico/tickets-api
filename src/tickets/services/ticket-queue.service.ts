import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { QueueItem, QueueStatus } from '../entities/queue-item.entity';
import { QUEUE_PROCESSOR, QUEUE_PROCESS_JOB } from '../tickets.constants';
import { RedisService } from '../../shared/services/redis.service';

@Injectable()
export class TicketQueueService {
  private readonly logger = new Logger(TicketQueueService.name);
  private readonly QUEUE_KEY = 'ticket_queue';

  constructor(
    @InjectRepository(QueueItem)
    private queueItemRepository: Repository<QueueItem>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectQueue(QUEUE_PROCESSOR)
    private ticketQueue: Queue,
    private redisService: RedisService,
  ) {}

  // Додає квиток у чергу бронювання
  async addToQueue(userId: string, ticketId: string): Promise<QueueItem> {
    // Перевіряємо доступність квитка
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new Error('Квиток не знайдено');
    }

    if (ticket.status !== TicketStatus.AVAILABLE) {
      throw new Error('Квиток недоступний для бронювання');
    }

    // Блокуємо квиток для атомарної операції
    const lockKey = `lock:ticket:${ticketId}`;
    const lockAcquired = await this.redisService.setLock(lockKey, 10);

    if (!lockAcquired) {
      throw new Error('Квиток зараз обробляється іншим запитом');
    }

    try {
      // Встановлюємо статус квитка як "в черзі"
      ticket.status = TicketStatus.IN_QUEUE;
      await this.ticketRepository.save(ticket);

      // Отримуємо поточну позицію в черзі
      const position = await this.redisService.incr(this.QUEUE_KEY);

      // Створюємо запис у черзі
      const queueItem = this.queueItemRepository.create({
        userId,
        ticketId,
        position,
        status: QueueStatus.WAITING,
      });

      await this.queueItemRepository.save(queueItem);

      // Запускаємо фонове завдання для обробки запиту в черзі
      await this.ticketQueue.add(
        QUEUE_PROCESS_JOB,
        {
          queueItemId: queueItem.id,
          userId,
          ticketId,
        },
        {
          delay: position * 1000, // Затримка на основі позиції в черзі
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return queueItem;
    } finally {
      // Знімаємо блокування
      await this.redisService.releaseLock(lockKey);
    }
  }

  // Отримує поточну позицію елемента в черзі
  async getPosition(queueItemId: string): Promise<number> {
    const queueItem = await this.queueItemRepository.findOne({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error('Елемент черги не знайдено');
    }

    return queueItem.position;
  }

  // Отримує загальну кількість елементів у черзі
  async getTotalQueueSize(): Promise<number> {
    const count = await this.redisService.get(this.QUEUE_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  // Оновлює статус елемента черги
  async updateStatus(
    queueItemId: string,
    status: QueueStatus,
  ): Promise<QueueItem> {
    const queueItem = await this.queueItemRepository.findOne({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error('Елемент черги не знайдено');
    }

    queueItem.status = status;
    return this.queueItemRepository.save(queueItem);
  }
}
