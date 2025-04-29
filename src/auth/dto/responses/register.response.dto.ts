import { ApiProperty } from '@nestjs/swagger';
import { TokenResponseDto, AuthUserDto } from './shared.dto';

export class RegisterResponseDto implements TokenResponseDto {
  @ApiProperty({
    type: AuthUserDto,
    description: 'User information',
  })
  user: AuthUserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  token: string;
}
