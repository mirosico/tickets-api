import { ApiProperty } from '@nestjs/swagger';

export class ConcertDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Concert unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'Rock Festival 2024',
    description: 'Concert title',
  })
  title: string;

  @ApiProperty({
    example: 'Annual rock music festival featuring top bands',
    description: 'Concert description',
  })
  description: string;

  @ApiProperty({
    example: '2024-07-15T19:00:00.000Z',
    description: 'Concert date and time',
  })
  eventDate: Date;

  @ApiProperty({
    example: 'National Stadium',
    description: 'Venue name',
  })
  venue: string;

  @ApiProperty({
    example: '2024-03-20T15:30:00.000Z',
    description: 'Record creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-20T15:30:00.000Z',
    description: 'Record last update timestamp',
  })
  updatedAt: Date;
} 