import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  name: string;

  @ApiProperty({
    example: '+380501234567',
    description: 'User phone number',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    example: '2023-10-20T15:30:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;
}
