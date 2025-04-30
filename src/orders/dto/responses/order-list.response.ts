import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from '../order.dto';

export class OrderListResponse {
  @ApiProperty({
    type: [OrderDto],
    description: 'List of orders',
  })
  orders: OrderDto[];
} 