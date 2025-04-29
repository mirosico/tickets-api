import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Cart item ID',
  })
  id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Ticket ID',
  })
  ticketId: string;

  @ApiProperty({
    example: 100.0,
    description: 'Ticket price',
  })
  price: number;

  @ApiProperty({
    example: '2024-03-20T15:30:00.000Z',
    description: 'When the item was added to cart',
  })
  createdAt: Date;
}

export class CartDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Cart ID',
  })
  id: string;

  @ApiProperty({
    type: [CartItemDto],
    description: 'List of items in the cart',
  })
  items: CartItemDto[];
}

export class CartResponse {
  @ApiProperty({
    type: CartDto,
    description: 'Cart details with items',
  })
  cart: CartDto;
}
