import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { TicketQueueService } from './services/ticket-queue.service';
import { AuthenticatedRequest } from '@types';
import { getError } from '@utils';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CartsService } from '@carts/carts.service';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketQueueService: TicketQueueService,
    private readonly cartsService: CartsService,
  ) {}

  @Post(':id/queue')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @Post('process-expired-reservations')
  @UseGuards(JwtAuthGuard)
  async processExpiredReservations() {
    try {
      const processedCount =
        await this.cartsService.processExpiredReservations();

      return {
        success: true,
        processedCount,
        message: `Оброблено прострочених резервацій: ${processedCount}`,
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
