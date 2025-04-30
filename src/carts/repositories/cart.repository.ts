import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { BaseRepository } from '@shared/repositories/base.repository';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class CartRepository extends BaseRepository<Cart> {
  constructor(dataSource: DataSource) {
    super(Cart, dataSource);
  }

  async findUserActiveCart(userId: string): Promise<Cart | null> {
    return this.createReadQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'cartItem')
      .leftJoinAndSelect('cartItem.ticket', 'ticket')
      .where('cart.userId = :userId', { userId })
      .orderBy('cart.createdAt', 'DESC')
      .getOne();
  }

  async createCart(userId: string): Promise<Cart> {
    return this.saveWrite({
      userId,
      items: [],
    });
  }

  async addItemToCart(cartId: string, ticketId: string): Promise<void> {
    const cart = await this.findOneReadOnly({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    // Create reservedUntil date
    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + 15); // Reserve for 15 minutes

    // Create new CartItem instance
    const cartItem = new CartItem();
    cartItem.cartId = cartId;
    cartItem.ticketId = ticketId;
    cartItem.reservedUntil = reservedUntil;

    // Add to cart's items
    cart.items.push(cartItem);

    await this.saveWrite(cart);
  }

  async removeItemFromCart(cartId: string, ticketId: string): Promise<void> {
    const cart = await this.findOneReadOnly({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    cart.items = cart.items.filter((item) => item.ticketId !== ticketId);
    await this.saveWrite(cart);
  }

  async clearCart(cartId: string): Promise<void> {
    const cart = await this.findOneReadOnly({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    await this.updateWrite({ id: cartId }, { items: [] });
  }

  async getCartWithItems(cartId: string): Promise<Cart> {
    const cart = await this.createReadQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'cartItem')
      .leftJoinAndSelect('cartItem.ticket', 'ticket')
      .leftJoinAndSelect('ticket.concert', 'concert')
      .where('cart.id = :cartId', { cartId })
      .getOne();

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    return cart;
  }
}
