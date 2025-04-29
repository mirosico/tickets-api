import { ApiProperty } from '@nestjs/swagger';
import { OrderItemDto } from './order-item.dto';

export class OrderDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Order ID',
  })
  id: string;

  @ApiProperty({
    example: 'pending',
    description: 'Order status',
    enum: ['pending', 'paid', 'cancelled'],
  })
  status: string;

  @ApiProperty({
    example: 299.99,
    description: 'Total order amount',
  })
  totalAmount: number;

  @ApiProperty({
    example: '2024-03-20T15:30:00.000Z',
    description: 'Order creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Order items',
  })
  items: OrderItemDto[];
}
