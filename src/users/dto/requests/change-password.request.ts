import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordRequest {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'Current user password',
  })
  oldPassword: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New user password',
  })
  newPassword: string;
}
