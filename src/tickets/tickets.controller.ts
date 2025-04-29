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
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  @Post(':id/queue')
  @UseGuards(JwtAuthGuard)
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
    description: 'Ticket ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved queue status',
    type: QueueStatusResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 400,
    description: 'Queue or ticket not found',
  })
  @Get('queue/:id')
  @UseGuards(JwtAuthGuard)
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
