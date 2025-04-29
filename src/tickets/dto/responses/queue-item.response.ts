import { ApiProperty } from '@nestjs/swagger';

export class QueueItemResponse {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Queue item unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 1,
    description: 'Position in queue',
  })
  position: number;

  @ApiProperty({
    example: 'pending',
    description: 'Queue item status',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  status: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID who requested the ticket',
  })
  userId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Ticket ID being queued for',
  })
  ticketId: string;

  @ApiProperty({
    example: '2024-03-20T15:30:00.000Z',
    description: 'When the queue item was created',
  })
  createdAt: Date;
}
