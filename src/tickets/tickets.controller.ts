import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { TicketQueueService } from './services/ticket-queue.service';
import { AuthenticatedRequest } from '../shared/types';
import { getError } from '../shared/utils/getError';
// TODO: add JwtAuthGuard
//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketQueueService: TicketQueueService) {}

  @Post(':id/queue')
  // TODO: add JwtAuthGuard
  //@UseGuards(JwtAuthGuard)
  async addToQueue(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const queueItem = await this.ticketQueueService.addToQueue(userId, id);

      return {
        queueItem,
        message: `Ваш запит додано в чергу. Поточна позиція: ${queueItem.position}`,
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }

  @Get('queue/:id')
  // TODO: add JwtAuthGuard
  //@UseGuards(JwtAuthGuard)
  async getQueueStatus(@Param('id') id: string) {
    try {
      const position = await this.ticketQueueService.getPosition(id);
      const totalSize = await this.ticketQueueService.getTotalQueueSize();

      return {
        position,
        totalSize,
        message: `Ваша позиція в черзі: ${position}`,
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }
}
