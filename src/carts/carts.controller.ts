import { Controller, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@types';
import { getError } from '@utils';
import { CartsService } from './carts.service';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartResponse } from './dto/responses/cart.response';
import { MessageResponse } from './dto/responses/message.response';
import { ApiCommonResponses, ApiAuthResponses } from '@shared/decorators';

@ApiTags('Shopping Cart')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's shopping cart" })
  @ApiResponse({
    status: 200,
    description: "Returns the user's shopping cart with items",
    type: CartResponse,
  })
  @ApiAuthResponses()
  @ApiCommonResponses()
  async getCart(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id;
      const { cart, items } = await this.cartsService.getCart(userId);

      return {
        cart: {
          id: cart?.id,
          items,
        },
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({
    name: 'id',
    description: 'Cart item ID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Item successfully removed from cart',
    type: MessageResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Cart or cart item not found',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Cart item not found',
        },
      },
    },
  })
  @ApiAuthResponses()
  @ApiCommonResponses()
  async removeFromCart(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.id;
      await this.cartsService.removeFromCart(userId, id);

      return {
        message: 'Ticket successfully removed from cart',
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }
}
