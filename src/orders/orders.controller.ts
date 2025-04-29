import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { getError } from '@utils';
import { AuthenticatedRequest } from '@types';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderListResponse, OrderResponse, OrderStatusResponse } from './dto';
import { ApiCommonResponses, ApiAuthResponses } from '@shared/decorators';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user orders' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of user orders',
    type: OrderListResponse,
  })
  @ApiCommonResponses()
  @ApiAuthResponses()
  async findAll(@Req() req: AuthenticatedRequest): Promise<OrderListResponse> {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns order details',
    type: OrderResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Order with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  @ApiCommonResponses()
  @ApiAuthResponses()
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<OrderResponse> {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderStatusResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Cart is empty or some tickets have expired reservations',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          examples: ['Cart is empty', 'Some tickets have expired reservations'],
        },
      },
    },
  })
  @ApiCommonResponses()
  @ApiAuthResponses()
  async createFromCart(
    @Req() req: AuthenticatedRequest,
  ): Promise<OrderStatusResponse> {
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
        message: 'Order has been created successfully',
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrderStatusResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Order with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'You can only cancel orders in the "pending" status',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'You can only cancel orders in the "pending" status',
        },
      },
    },
  })
  @ApiCommonResponses()
  @ApiAuthResponses()
  async cancelOrder(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<OrderStatusResponse> {
    try {
      const userId = req.user.id;
      const order = await this.ordersService.cancelOrder(id, userId);

      return {
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
        },
        message: 'Order has been cancelled successfully',
      };
    } catch (e) {
      throw getError(e);
    }
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete order payment' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully',
    type: OrderStatusResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Order with ID 123e4567-e89b-12d3-a456-426614174000 not found',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'You cannot pay for an order in the current status',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'You cannot pay for an order in the current status',
        },
      },
    },
  })
  @ApiCommonResponses()
  @ApiAuthResponses()
  async completePayment(@Param('id') id: string): Promise<OrderStatusResponse> {
    try {
      const order = await this.ordersService.completePayment(id);

      return {
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
        },
        message: 'Payment has been processed successfully',
      };
    } catch (e) {
      throw getError(e);
    }
  }
}
