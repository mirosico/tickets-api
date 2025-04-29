import { ApiProperty } from '@nestjs/swagger';

export class OrderStatusResponse {
  @ApiProperty({
    type: 'object',
    properties: {
      id: {
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Order ID',
      },
      status: {
        type: 'string',
        example: 'CANCELLED',
        enum: ['PENDING', 'PAID', 'CANCELLED'],
        description: 'Order status',
      },
    },
    description: 'Order details',
  })
  order: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
  };

  @ApiProperty({
    example: 'Order has been cancelled successfully',
    description: 'Status message',
  })
  message: string;
}
