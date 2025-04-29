import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileRequest {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: '+380501234567',
    description: 'User phone number',
    required: false,
    nullable: true,
  })
  phone?: string;
}
