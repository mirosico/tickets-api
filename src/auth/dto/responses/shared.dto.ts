import { ApiProperty } from '@nestjs/swagger';

export interface TokenResponseDto {
  token: string;
}

export class AuthUserDto {
  @ApiProperty({
    example: '81667441-b913-44ab-a9d2-73f80785dfef',
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
}
