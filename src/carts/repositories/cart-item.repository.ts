import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class CartItemRepository extends BaseRepository<CartItem> {
  constructor(dataSource: DataSource) {
    super(CartItem, dataSource);
  }

  async findByCartId(cartId: string): Promise<CartItem[]> {
    return this.createReadQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.ticket', 'ticket')
      .where('cartItem.cartId = :cartId', { cartId })
      .getMany();
  }

  async createCartItem(
    cartId: string,
    ticketId: string,
    reservedUntil: Date,
  ): Promise<CartItem> {
    return this.saveWrite({
      cartId,
      ticketId,
      reservedUntil,
    });
  }
}
