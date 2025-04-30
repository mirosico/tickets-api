import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Concert } from '../entities/concert.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class ConcertRepository extends BaseRepository<Concert> {
  constructor(dataSource: DataSource) {
    super(Concert, dataSource);
  }

  async findUpcomingConcerts(): Promise<Concert[]> {
    return this.createReadQueryBuilder('concert')
      .where('concert.eventDate > :now', { now: new Date() })
      .orderBy('concert.eventDate', 'ASC')
      .getMany();
  }

  async findConcertWithTickets(id: string): Promise<Concert> {
    const concert = await this.createReadQueryBuilder('concert')
      .leftJoinAndSelect('concert.tickets', 'ticket')
      .where('concert.id = :id', { id })
      .getOne();

    if (!concert) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }

    return concert;
  }

  async createConcert(concertData: Partial<Concert>): Promise<Concert> {
    return this.saveWrite(concertData);
  }

  async updateConcert(
    id: string,
    concertData: Partial<Concert>,
  ): Promise<void> {
    const concert = await this.findOneReadOnly({ where: { id } });
    if (!concert) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }

    await this.updateWrite({ id }, concertData);
  }

  async deleteConcert(id: string): Promise<void> {
    const concert = await this.findOneReadOnly({ where: { id } });
    if (!concert) {
      throw new NotFoundException(`Concert with ID ${id} not found`);
    }

    await this.deleteWrite({ id });
  }

  async searchConcerts(query: string): Promise<Concert[]> {
    return this.createReadQueryBuilder('concert')
      .where('concert.title ILIKE :query OR concert.description ILIKE :query', {
        query: `%${query}%`,
      })
      .orderBy('concert.eventDate', 'ASC')
      .getMany();
  }
}
