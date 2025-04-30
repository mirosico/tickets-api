import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { TicketQueueService } from './services/ticket-queue.service';
import { AuthenticatedRequest } from '@types';
import { getError } from '@utils';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CartsService } from '@carts/carts.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AddToQueueResponse, QueueStatusResponse } from './dto';
import { ApiAuthResponses } from '@shared/decorators';
import { ApiCommonResponses } from '@shared/decorators';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketQueueService: TicketQueueService,
    private readonly cartsService: CartsService,
  ) {}

  @ApiOperation({ summary: 'Add user to ticket queue' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully added to queue',
    type: AddToQueueResponse,
    schema: {
      type: 'object',
      properties: {
        queueItem: {
          type: 'object',
          example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            position: 1,
            status: 'pending',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            ticketId: '123e4567-e89b-12d3-a456-426614174000',
            createdAt: '2024-03-20T15:30:00.000Z',
          },
        },
        message: {
          type: 'string',
          example:
            'Your request has been added to the queue. Current position: 1',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket or queue item not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Ticket not found' },
      },
    },
  })
  @Post(':id/queue')
  @UseGuards(JwtAuthGuard)
  @ApiCommonResponses()
  @ApiAuthResponses()
  async addToQueue(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AddToQueueResponse> {
    try {
      const userId = req.user.id;
      const queueItem = await this.ticketQueueService.addToQueue(userId, id);

      return {
        queueItem,
        message: `Your request has been added to the queue. Current position: ${queueItem.position}`,
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }

  @ApiOperation({ summary: 'Get queue status for a ticket' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'Queue item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved queue status',
    type: QueueStatusResponse,
    schema: {
      type: 'object',
      properties: {
        position: { type: 'number', example: 1 },
        totalSize: { type: 'number', example: 10 },
        message: {
          type: 'string',
          example: 'Your position in queue: 1',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found',
  })
  @Get('queue/:id')
  @UseGuards(JwtAuthGuard)
  @ApiCommonResponses()
  @ApiAuthResponses()
  async getQueueStatus(@Param('id') id: string): Promise<QueueStatusResponse> {
    try {
      const position = await this.ticketQueueService.getPosition(id);
      const totalSize = await this.ticketQueueService.getTotalQueueSize(id);

      return {
        position,
        totalSize,
        message: `Your position in queue: ${position}`,
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }
}
