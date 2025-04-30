import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from '../order.dto';

export class OrderResponse {
  @ApiProperty({
    type: OrderDto,
    description: 'Order details',
  })
  order: OrderDto;
} 