import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.createReadQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.createReadQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    const user = this.create(data);
    return this.saveWrite(user);
  }

  async updateUser(
    id: string,
    data: { name?: string; phone?: string },
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, data);
    return this.saveWrite(user);
  }

  async findUserWithOrders(id: string): Promise<User | null> {
    return this.createReadQueryBuilder('user')
      .leftJoinAndSelect('user.orders', 'order')
      .leftJoinAndSelect('order.items', 'orderItem')
      .leftJoinAndSelect('orderItem.ticket', 'ticket')
      .leftJoinAndSelect('ticket.concert', 'concert')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findUserWithCarts(id: string): Promise<User | null> {
    return this.createReadQueryBuilder('user')
      .leftJoinAndSelect('user.carts', 'cart')
      .leftJoinAndSelect('cart.items', 'cartItem')
      .leftJoinAndSelect('cartItem.ticket', 'ticket')
      .where('user.id = :id', { id })
      .getOne();
  }
}
