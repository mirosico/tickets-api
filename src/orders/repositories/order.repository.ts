import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class OrderRepository extends BaseRepository<Order> {
  constructor(dataSource: DataSource) {
    super(Order, dataSource);
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.createReadQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'orderItem')
      .leftJoinAndSelect('orderItem.ticket', 'ticket')
      .leftJoinAndSelect('ticket.concert', 'concert')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async findOrderWithItems(orderId: string): Promise<Order> {
    const order = await this.createReadQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'orderItem')
      .leftJoinAndSelect('orderItem.ticket', 'ticket')
      .leftJoinAndSelect('ticket.concert', 'concert')
      .where('order.id = :orderId', { orderId })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return this.saveWrite({
      ...orderData,
      status: OrderStatus.PENDING,
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = await this.findOneReadOnly({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    await this.updateWrite({ id: orderId }, { status });
  }

  async findPendingOrders(): Promise<Order[]> {
    return this.findReadOnly({
      where: { status: OrderStatus.PENDING },
      relations: ['items', 'items.ticket', 'items.ticket.concert'],
      order: { createdAt: 'ASC' },
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await this.findOneReadOnly({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    await this.updateWrite({ id: orderId }, { status: OrderStatus.CANCELLED });
  }

  async findOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.createReadQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'orderItem')
      .leftJoinAndSelect('orderItem.ticket', 'ticket')
      .where('order.status = :status', { status })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }
}
