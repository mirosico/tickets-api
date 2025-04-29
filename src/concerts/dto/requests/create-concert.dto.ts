import { ApiProperty } from '@nestjs/swagger';

export class CreateConcertDto {
  @ApiProperty({
    description: 'Concert title',
    example: 'Rock Festival 2024',
  })
  title: string;

  @ApiProperty({
    description: 'Concert description',
    example: 'Annual rock music festival featuring top bands',
  })
  description: string;

  @ApiProperty({
    description: 'Concert date and time',
    example: '2024-07-15T19:00:00.000Z',
  })
  eventDate: string;

  @ApiProperty({
    description: 'Venue name',
    example: 'National Stadium',
  })
  venue: string;

  @ApiProperty({
    description: 'Number of tickets available',
    example: 1000,
    minimum: 1,
  })
  tickets: number;

  @ApiProperty({
    description: 'Price per ticket',
    example: 100.50,
    minimum: 0,
  })
  ticketPrice: number;
} 