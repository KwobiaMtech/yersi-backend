import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from '../schemas/order.schema';

@Injectable()
export class OrdersRepository {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async create(orderData: Partial<Order>): Promise<Order> {
    return this.orderModel.create(orderData);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderModel
      .findById(id)
      .populate('vendorId')
      .exec();
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ userId })
      .populate('vendorId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return this.orderModel
      .findByIdAndUpdate(
        id,
        { 
          status, 
          lastStatusUpdate: new Date(),
          progressPercentage: this.getProgressPercentage(status),
        },
        { new: true }
      )
      .exec();
  }

  private getProgressPercentage(status: OrderStatus): number {
    const statusMap = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PICKED_UP]: 20,
      [OrderStatus.IN_WASH]: 40,
      [OrderStatus.READY_FOR_PICKUP]: 60,
      [OrderStatus.DELIVERING]: 80,
      [OrderStatus.COMPLETED]: 100,
      [OrderStatus.CANCELLED]: 0,
    };
    return statusMap[status] || 0;
  }

  async generateOrderNumber(): Promise<string> {
    const count = await this.orderModel.countDocuments();
    return (65789903 + count).toString();
  }
}