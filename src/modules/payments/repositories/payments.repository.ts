import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentStatus } from '../schemas/payment.schema';

@Injectable()
export class PaymentsRepository {
  constructor(@InjectModel(Payment.name) private paymentModel: Model<Payment>) {}

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    return this.paymentModel.create(paymentData);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.paymentModel.findById(id).exec();
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ orderId }).exec();
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment | null> {
    return this.paymentModel
      .findByIdAndUpdate(
        id,
        { status, transactionId },
        { new: true }
      )
      .exec();
  }
}