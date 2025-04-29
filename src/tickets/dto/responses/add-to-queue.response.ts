import { ApiProperty } from '@nestjs/swagger';
import { QueueItemResponse } from './queue-item.response';

export class AddToQueueResponse {
  @ApiProperty({
    type: QueueItemResponse,
    description: 'Queue item details',
  })
  queueItem: QueueItemResponse;

  @ApiProperty({
    example: 'Your request has been added to the queue. Current position: 1',
    description: 'Success message with queue position',
  })
  message: string;
}
