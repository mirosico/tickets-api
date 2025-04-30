import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrderItem } from '../entities/order-item.entity';
import { BaseRepository } from '@shared/repositories/base.repository';

@Injectable()
export class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor(dataSource: DataSource) {
    super(OrderItem, dataSource);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.createReadQueryBuilder('orderItem')
      .leftJoinAndSelect('orderItem.ticket', 'ticket')
      .leftJoinAndSelect('ticket.concert', 'concert')
      .where('orderItem.orderId = :orderId', { orderId })
      .getMany();
  }

  async createOrderItem(orderItemData: Partial<OrderItem>): Promise<OrderItem> {
    return this.saveWrite(orderItemData);
  }

  async createOrderItems(
    orderItems: Partial<OrderItem>[],
  ): Promise<OrderItem[]> {
    return Promise.all(orderItems.map((item) => this.createOrderItem(item)));
  }
}
