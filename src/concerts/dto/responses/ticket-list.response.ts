import { ApiProperty } from '@nestjs/swagger';

class TicketDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Ticket ID',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Concert ID',
  })
  concertId: string;

  @ApiProperty({
    example: 'A1',
    description: 'Seat number',
  })
  seatNumber: string;

  @ApiProperty({
    example: 'AVAILABLE',
    description: 'Ticket status',
    enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
  })
  status: string;

  @ApiProperty({
    example: 100.5,
    description: 'Ticket price',
  })
  price: number;
}

export class TicketListResponse {
  @ApiProperty({
    type: [TicketDto],
    description: 'List of tickets',
  })
  tickets: TicketDto[];
}
