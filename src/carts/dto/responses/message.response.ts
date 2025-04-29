import { ApiProperty } from '@nestjs/swagger';

export class MessageResponse {
  @ApiProperty({
    example: 'Квиток успішно видалено з кошика',
    description: 'Success message',
  })
  message: string;
} 