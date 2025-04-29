import { ApiProperty } from '@nestjs/swagger';
import { OrderTicketDto } from './ticket.dto';

export class OrderItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Order item ID',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Ticket ID',
  })
  ticketId: string;

  @ApiProperty({
    example: 100.50,
    description: 'Ticket price',
  })
  price: number;

  @ApiProperty({
    type: OrderTicketDto,
    nullable: true,
    description: 'Ticket details',
  })
  ticket: OrderTicketDto | null;
} 