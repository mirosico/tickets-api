import { ApiProperty } from '@nestjs/swagger';

export class MessageResponse {
  @ApiProperty({
    example: 'Ticket successfully removed from cart',
    description: 'Success message',
  })
  message: string;
}
