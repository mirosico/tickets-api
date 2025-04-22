import { Controller, Get, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../shared/types';
import { getError } from '../shared/utils';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
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
  async removeFromCart(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user.id;
      await this.cartsService.removeFromCart(userId, id);

      return {
        message: 'Квиток успішно видалено з кошика',
      };
    } catch (error: unknown) {
      throw getError(error);
    }
  }
}
