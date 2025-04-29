import { ApiProperty } from '@nestjs/swagger';

export class QueueStatusResponse {
  @ApiProperty({
    example: 1,
    description: 'Current position in queue',
  })
  position: number;

  @ApiProperty({
    example: 100,
    description: 'Total number of people in queue',
  })
  totalSize: number;

  @ApiProperty({
    example: 'Your position in queue: 1',
    description: 'Status message',
  })
  message: string;
}
