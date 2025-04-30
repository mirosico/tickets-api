import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { QueueItem, QueueStatus } from '../entities/queue-item.entity';
import { QUEUE_PROCESSOR, QUEUE_PROCESS_JOB } from '../tickets.constants';
import { RedisService } from '@services/redis.service';
import { getLockKey, getQueueKey } from '@utils';
import { NotificationsService } from '@notifications/notifications.service';

@Injectable()
export class TicketQueueService {
  constructor(
    @InjectRepository(QueueItem)
    private queueItemRepository: Repository<QueueItem>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectQueue(QUEUE_PROCESSOR)
    private ticketQueue: Queue,
    private redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async addToQueue(userId: string, ticketId: string): Promise<QueueItem> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.AVAILABLE) {
      throw new Error('Ticket is not available for booking');
    }

    console.log('Adding to queue', ticketId, ticket.status, userId);

    const lockKey = getLockKey(ticketId);
    const lockAcquired = await this.redisService.setLock(lockKey, 10);

    if (!lockAcquired) {
      throw new Error('Ticket is being processed by another request');
    }

    try {
      ticket.status = TicketStatus.IN_QUEUE;
      await this.ticketRepository.save(ticket);

      const position = await this.redisService.incr(getQueueKey(ticketId));

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

      this.notificationsService.sendQueueUpdate(
        userId,
        queueItem.id,
        queueItem.position,
        QueueStatus.WAITING,
        ticketId,
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
      throw new NotFoundException('Queue item not found');
    }

    return queueItem.position;
  }

  async getTotalQueueSize(queueItemId: string): Promise<number> {
    const queueItem = await this.queueItemRepository.findOne({
      where: { id: queueItemId },
    });
    if (!queueItem) {
      throw new NotFoundException('Queue item not found');
    }
    const count = await this.redisService.get(getQueueKey(queueItem.ticketId));
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
      throw new NotFoundException('Queue item not found');
    }

    queueItem.status = status;

    this.notificationsService.sendQueueUpdate(
      queueItem.userId,
      queueItem.id,
      queueItem.position,
      status,
      queueItem.ticketId,
    );
    return this.queueItemRepository.save(queueItem);
  }
}
