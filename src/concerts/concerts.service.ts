import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Concert } from './entities/concert.entity';
import { Ticket, TicketStatus } from '@tickets/entities/ticket.entity';
import { RedisService } from '@services/redis.service';
import { getTicketCountKey } from '@utils';
import { NotificationsService } from '@notifications/notifications.service';
import { ConcertRepository } from './repositories/concert.repository';

interface PaginationOptions {
  page: number;
  limit: number;
}

interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface ConcertWithTicketCount extends Concert {
  availableTickets: number;
}

export interface CreateConcert {
  title: string;
  description: string;
  eventDate: string;
  venue: string;
  tickets: number;
  ticketPrice: number;
}

@Injectable()
export class ConcertsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private redisService: RedisService,
    private notificationsService: NotificationsService,
    private readonly concertRepository: ConcertRepository,
  ) {}

  async findAll({
    page,
    limit,
  }: PaginationOptions): Promise<PaginatedResult<ConcertWithTicketCount>> {
    const skip = (page - 1) * limit;

    const [concerts, totalItems] = await this.concertRepository.findAndCount({
      order: { eventDate: 'ASC' },
      skip,
      take: limit,
    });

    const concertsWithTicketCount = await Promise.all(
      concerts.map(async (concert) => {
        const availableTickets = await this.getAvailableTicketsCount(
          concert.id,
        );
        return {
          ...concert,
          availableTickets,
        };
      }),
    );

    return {
      items: concertsWithTicketCount,
      totalItems,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };
  }

  async findOne(id: string): Promise<ConcertWithTicketCount> {
    const concert = await this.concertRepository.findOneReadOnly({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }

    const availableTickets = await this.getAvailableTicketsCount(id);

    return {
      ...concert,
      availableTickets,
    };
  }

  async getTicketsForConcert(concertId: string) {
    const concert = await this.concertRepository.findOneReadOnly({
      where: { id: concertId },
    });

    if (!concert) {
      throw new NotFoundException(`Concert with ID ${concertId} not found`);
    }

    return this.ticketRepository.find({
      where: { concertId },
      order: { seatNumber: 'ASC' },
    });
  }

  async getAvailableTicketsCount(concertId: string) {
    const cachedCount = await this.redisService.get(
      getTicketCountKey(concertId),
    );

    if (cachedCount) {
      return parseInt(cachedCount, 10);
    }

    const count = await this.ticketRepository.count({
      where: {
        concertId,
        status: TicketStatus.AVAILABLE,
      },
    });

    await this.redisService.set(
      getTicketCountKey(concertId),
      count.toString(),
      300,
    );

    return count;
  }

  async create(concertData: CreateConcert): Promise<Concert> {
    const queryRunner =
      this.concertRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const concert = await this.concertRepository.createConcert({
        title: concertData.title,
        description: concertData.description,
        eventDate: new Date(concertData.eventDate),
        venue: concertData.venue,
      });

      const tickets: Partial<Ticket>[] = [];

      for (let i = 1; i <= concertData.tickets; i++) {
        tickets.push({
          concertId: concert.id,
          seatNumber: `A${i}`,
          status: TicketStatus.AVAILABLE,
          price: concertData.ticketPrice,
        });
      }

      await queryRunner.manager.save(Ticket, tickets);
      await queryRunner.commitTransaction();

      return concert;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async decrementAvailableTicketsCount(concertId: string): Promise<void> {
    const key = getTicketCountKey(concertId);
    const count = await this.redisService.get(key);

    if (count) {
      const updatedCount = Math.max(0, parseInt(count, 10) - 1);

      this.notificationsService.broadcastTicketAvailabilityChange(
        concertId,
        updatedCount,
      );
      await this.redisService.set(key, updatedCount.toString(), 300);
    }
  }

  async incrementAvailableTicketsCount(concertId: string): Promise<void> {
    const key = getTicketCountKey(concertId);
    const count = await this.redisService.get(key);

    if (count) {
      const updatedCount = parseInt(count, 10) + 1;

      this.notificationsService.broadcastTicketAvailabilityChange(
        concertId,
        updatedCount,
      );
      await this.redisService.set(key, updatedCount.toString(), 300);
    }
  }
}
