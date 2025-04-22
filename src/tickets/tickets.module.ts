import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { Ticket } from './entities/ticket.entity';
import { QueueItem } from './entities/queue-item.entity';
import { TicketsController } from './tickets.controller';
import { TicketQueueService } from './services/ticket-queue.service';
import { TicketQueueProcessor } from './processors/ticket-queue.processor';
import { ExpiredReservationsProcessor } from './processors/expired-reservations.processor';
import {
  QUEUE_PROCESSOR,
  EXPIRED_RESERVATIONS_PROCESSOR,
} from './tickets.constants';
import { SharedModule } from '../shared/shared.module';
import { CartsModule } from '../carts/carts.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, QueueItem]),
    BullModule.registerQueue(
      {
        name: QUEUE_PROCESSOR,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: EXPIRED_RESERVATIONS_PROCESSOR,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
    ScheduleModule.forRoot(),
    SharedModule,
    CartsModule,
    NotificationsModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketQueueService,
    TicketQueueProcessor,
    ExpiredReservationsProcessor,
  ],
  exports: [TicketQueueService],
})
export class TicketsModule {}
