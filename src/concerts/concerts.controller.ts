import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { getError } from '@utils';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateConcertDto,
  ConcertListResponse,
  ConcertResponse,
  TicketListResponse,
} from './dto';

@ApiTags('Concerts')
@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all concerts with pagination' })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of concerts with pagination metadata',
    type: ConcertListResponse,
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<ConcertListResponse> {
    try {
      const { items, ...meta } = await this.concertsService.findAll({
        page: +page,
        limit: +limit,
      });

      return {
        concerts: items,
        meta,
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get concert by ID' })
  @ApiParam({
    name: 'id',
    description: 'Concert ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns concert details',
    type: ConcertResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Concert not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Concert not found',
        },
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<ConcertResponse> {
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
  @ApiOperation({ summary: 'Get tickets for a concert' })
  @ApiParam({
    name: 'id',
    description: 'Concert ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of tickets for the concert',
    type: TicketListResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Concert not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Concert not found',
        },
      },
    },
  })
  async getTickets(@Param('id') id: string): Promise<TicketListResponse> {
    try {
      const tickets = await this.concertsService.getTicketsForConcert(id);

      return {
        tickets,
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new concert' })
  @ApiResponse({
    status: 201,
    description: 'Concert created successfully',
    type: ConcertResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid concert data',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Invalid concert data',
        },
        errors: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['Title is required', 'Event date must be in the future'],
        },
      },
    },
  })
  async create(
    @Body() createConcertDto: CreateConcertDto,
  ): Promise<ConcertResponse> {
    try {
      const concert = await this.concertsService.create(createConcertDto);

      return {
        concert,
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
