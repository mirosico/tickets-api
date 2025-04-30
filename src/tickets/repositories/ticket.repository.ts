import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class TicketRepository extends BaseRepository<Ticket> {
  constructor(dataSource: DataSource) {
    super(Ticket, dataSource);
  }

  async findAvailableTickets(concertId: string): Promise<Ticket[]> {
    return this.createReadQueryBuilder('ticket')
      .where('ticket.concertId = :concertId', { concertId })
      .andWhere('ticket.status = :status', { status: TicketStatus.AVAILABLE })
      .getMany();
  }

  async findTicketsByIds(ids: string[]): Promise<Ticket[]> {
    return this.createReadQueryBuilder('ticket')
      .where('ticket.id IN (:...ids)', { ids })
      .getMany();
  }

  async reserveTickets(ticketIds: string[]): Promise<Ticket[]> {
    const tickets = await this.createReadQueryBuilder('ticket')
      .where('ticket.id IN (:...ticketIds)', { ticketIds })
      .getMany();

    if (tickets.length !== ticketIds.length) {
      throw new NotFoundException('Some tickets were not found');
    }

    const updatedTickets: Ticket[] = [];
    for (const ticket of tickets) {
      const updatedTicket = new Ticket();
      Object.assign(updatedTicket, ticket);
      updatedTicket.status = TicketStatus.RESERVED;
      updatedTickets.push(await this.saveWrite(updatedTicket));
    }

    return updatedTickets;
  }

  async releaseTickets(ticketIds: string[]): Promise<void> {
    await this.updateWrite(
      { id: In(ticketIds) },
      { status: TicketStatus.AVAILABLE },
    );
  }

  async markTicketsAsSold(ticketIds: string[]): Promise<void> {
    await this.updateWrite(
      { id: In(ticketIds) },
      { status: TicketStatus.SOLD },
    );
  }

  async countAvailableTickets(concertId: string): Promise<number> {
    return this.createReadQueryBuilder('ticket')
      .where('ticket.concertId = :concertId', { concertId })
      .andWhere('ticket.status = :status', { status: TicketStatus.AVAILABLE })
      .getCount();
  }

  async findTicketsWithConcert(ticketIds: string[]): Promise<Ticket[]> {
    return this.createReadQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.concert', 'concert')
      .where('ticket.id IN (:...ticketIds)', { ticketIds })
      .getMany();
  }

  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
  ): Promise<void> {
    const ticket = await this.findOneReadOnly({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    await this.updateWrite({ id: ticketId }, { status });
  }
}
