import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Concert } from './entities/concert.entity';
import { Ticket, TicketStatus } from '@tickets/entities/ticket.entity';
import { RedisService } from '@services/redis.service';
import { getTicketCountKey } from '@utils';
import { NotificationsService } from '@notifications/notifications.service';

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
    @InjectRepository(Concert)
    private concertRepository: Repository<Concert>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private redisService: RedisService,
    private notificationsService: NotificationsService,
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
    const concert = await this.concertRepository.findOne({ where: { id } });

    if (!concert) {
      throw new NotFoundException(`Концерт з ID ${id} не знайдено`);
    }

    // Додаємо кількість доступних квитків
    const availableTickets = await this.getAvailableTicketsCount(id);

    return {
      ...concert,
      availableTickets,
    };
  }

  async getTicketsForConcert(concertId: string) {
    // Перевіряємо, чи існує концерт
    const concert = await this.concertRepository.findOne({
      where: { id: concertId },
    });

    if (!concert) {
      throw new NotFoundException(`Концерт з ID ${concertId} не знайдено`);
    }

    return this.ticketRepository.find({
      where: { concertId },
      order: { seatNumber: 'ASC' },
    });
  }

  async getAvailableTicketsCount(concertId: string) {
    // Спершу перевіряємо, чи є значення в кеші
    const cachedCount = await this.redisService.get(
      getTicketCountKey(concertId),
    );

    if (cachedCount) {
      return parseInt(cachedCount, 10);
    }

    // Якщо немає в кеші, рахуємо з бази даних
    const count = await this.ticketRepository.count({
      where: {
        concertId,
        status: TicketStatus.AVAILABLE,
      },
    });

    // Зберігаємо в кеш на 5 хвилин
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
      // Створення нового об'єкта концерту
      const concert = this.concertRepository.create({
        title: concertData.title,
        description: concertData.description,
        eventDate: concertData.eventDate,
        venue: concertData.venue,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedConcert = await queryRunner.manager.save(concert);

      const tickets: Partial<Ticket>[] = [];

      for (let i = 1; i <= concertData.tickets; i++) {
        tickets.push({
          concertId: savedConcert.id,
          seatNumber: `A${i}`,
          status: TicketStatus.AVAILABLE,
          price: concertData.ticketPrice,
        });
      }

      await queryRunner.manager.save(Ticket, tickets);

      await queryRunner.commitTransaction();

      return savedConcert;
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
