import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../user.dto';

export class UserProfileResponse {
  @ApiProperty({
    description: 'User profile data',
    type: UserDto,
  })
  user: UserDto;
}
