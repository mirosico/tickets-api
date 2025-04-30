import { ApiProperty } from '@nestjs/swagger';

export class ProfileUserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User name',
  })
  name: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User creation date',
  })
  createdAt: Date;
}

export class ProfileResponseDto {
  @ApiProperty({
    type: ProfileUserDto,
    description: 'User information',
  })
  user: ProfileUserDto;
} 