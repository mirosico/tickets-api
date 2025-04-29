import { ApiProperty } from '@nestjs/swagger';
import { ConcertDto } from '../concert.dto';

export class ConcertListResponse {
  @ApiProperty({
    type: [ConcertDto],
    description: 'List of concerts',
  })
  concerts: ConcertDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      totalItems: {
        type: 'number',
        example: 100,
        description: 'Total number of concerts',
      },
      itemsPerPage: {
        type: 'number',
        example: 10,
        description: 'Number of items per page',
      },
      totalPages: {
        type: 'number',
        example: 10,
        description: 'Total number of pages',
      },
      currentPage: {
        type: 'number',
        example: 1,
        description: 'Current page number',
      },
    },
    description: 'Pagination metadata',
  })
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
