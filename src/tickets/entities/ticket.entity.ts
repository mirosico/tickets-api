import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Concert } from '../../concerts/entities/concert.entity';

export enum TicketStatus {
  AVAILABLE = 'available',
  IN_QUEUE = 'in_queue',
  RESERVED = 'reserved',
  SOLD = 'sold',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  concertId: string;

  @ManyToOne(() => Concert, (concert) => concert.tickets)
  @JoinColumn({ name: 'concertId' })
  concert: Concert;

  @Column()
  seatNumber: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
  })
  status: TicketStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
