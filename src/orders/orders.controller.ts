import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getError } from '../shared/utils/getError';
import { AuthenticatedRequest } from '../shared/types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const orders = await this.ordersService.findAllForUser(userId);

      return {
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            id: item.id,
            ticketId: item.ticketId,
            price: item.price,
            ticket: item.ticket
              ? {
                  seatNumber: item.ticket.seatNumber,
                  concertId: item.ticket.concertId,
                }
              : null,
          })),
        })),
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const order = await this.ordersService.findOne(id, userId);

      return {
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            id: item.id,
            ticketId: item.ticketId,
            price: item.price,
            ticket: item.ticket
              ? {
                  seatNumber: item.ticket.seatNumber,
                  concertId: item.ticket.concertId,
                }
              : null,
          })),
        },
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createFromCart(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const order = await this.ordersService.createFromCart(userId);

      return {
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
        },
        message: 'Замовлення успішно створено',
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const order = await this.ordersService.cancelOrder(id, userId);

      return {
        order: {
          id: order.id,
          status: order.status,
        },
        message: 'Замовлення успішно скасовано',
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  async completePayment(@Param('id') id: string) {
    try {
      // У реальній системі тут буде перевірка прав доступу до замовлення
      const order = await this.ordersService.completePayment(id);

      return {
        order: {
          id: order.id,
          status: order.status,
        },
        message: 'Оплату успішно оброблено',
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
