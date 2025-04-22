import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { getError } from '../shared/utils/getError';

@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    try {
      const concerts = await this.concertsService.findAll({
        page: +page,
        limit: +limit,
      });

      return {
        concerts: concerts.items,
        meta: {
          totalItems: concerts.totalItems,
          itemCount: concerts.items.length,
          itemsPerPage: concerts.itemsPerPage,
          totalPages: concerts.totalPages,
          currentPage: concerts.currentPage,
        },
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const concert = await this.concertsService.findOne(id);

      return {
        concert,
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Get(':id/tickets')
  async getTickets(@Param('id') id: string) {
    try {
      const tickets = await this.concertsService.getTicketsForConcert(id);

      return {
        tickets,
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
