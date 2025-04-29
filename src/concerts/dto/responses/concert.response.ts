import { ApiProperty } from '@nestjs/swagger';
import { ConcertDto } from '../concert.dto';

export class ConcertResponse {
  @ApiProperty({
    type: ConcertDto,
    description: 'Concert details',
  })
  concert: ConcertDto;
}
