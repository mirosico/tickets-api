import { ApiProperty } from '@nestjs/swagger';

export class OrderTicketDto {
  @ApiProperty({
    example: 'A1',
    description: 'Seat number',
  })
  seatNumber: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Concert ID',
  })
  concertId: string;
} 