import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrdersService } from '../../orders/services/orders.service';
import { UsersService } from '../../users/services/users.service';
import { InitializePaymentDto } from '../dto/payment.dto';
import { PaymentProviderFactory } from '../factories/payment-provider.factory';
import { Payment, PaymentStatus } from '../schemas/payment.schema';
import { TransactionStatus } from '../interfaces/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private ordersService: OrdersService,
    private usersService: UsersService,
    private paymentProviderFactory: PaymentProviderFactory,
  ) {}

  async initializePayment(paymentDto: InitializePaymentDto) {
    const order = await this.ordersService.getOrderById(paymentDto.orderId);
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const provider = this.paymentProviderFactory.getProvider();
    const referenceId = `YRS_${Date.now()}_${paymentDto.orderId}`;

    try {
      const depositResponse = await provider.deposit({
        phoneNumber: paymentDto.phoneNumber,
        amount: order.total,
        accountName: paymentDto.accountName,
        mobileMoneyProvider: paymentDto.mobileMoneyProvider,
        referenceId,
        currency: order.currency || 'GHS',
      });

      const payment = await this.paymentModel.create({
        orderId: paymentDto.orderId,
        userId: order.userId,
        amount: order.total,
        currency: order.currency || 'GHS',
        paymentMethod: 'mobile_money',
        status: this.mapStatus(depositResponse.status),
        transactionId: depositResponse.transactionId,
        phone: paymentDto.phoneNumber,
        network: paymentDto.mobileMoneyProvider,
        gatewayResponse: depositResponse,
      });

      this.logger.log(`Payment initialized: ${payment._id} - ${depositResponse.transactionId}`);

      return {
        paymentId: payment._id,
        transactionId: depositResponse.transactionId,
        status: depositResponse.status,
        amount: order.total,
        feeAmount: depositResponse.feeAmount,
        userAmount: depositResponse.userAmount,
        reference: referenceId,
      };
    } catch (error) {
      this.logger.error('Payment initialization failed', error);
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  async checkPaymentStatus(transactionId: string) {
    const payment = await this.paymentModel.findOne({ transactionId });
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const provider = this.paymentProviderFactory.getProvider();
    
    try {
      const statusResponse = await provider.getTransactionStatus(transactionId);
      
      payment.status = this.mapStatus(statusResponse.status);
      await payment.save();

      return {
        transactionId: statusResponse.transactionId,
        status: statusResponse.status,
        paymentId: payment._id,
      };
    } catch (error) {
      this.logger.error(`Status check failed for ${transactionId}`, error);
      throw error;
    }
  }

  async getWalletBalance(currency: string = 'GHS') {
    const provider = this.paymentProviderFactory.getProvider();
    return provider.getWalletBalance(currency);
  }

  async processPayment(paymentId: string, paymentMethod: string) {
    if (paymentMethod === 'credits') {
      await this.usersService.updateUserCredits(-25.50);
    }

    return {
      success: true,
      paymentId,
      status: 'completed',
    };
  }

  async getPaymentHistory(userId: string) {
    return this.paymentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  private mapStatus(providerStatus: TransactionStatus): PaymentStatus {
    switch (providerStatus) {
      case TransactionStatus.SUCCESS:
        return PaymentStatus.COMPLETED;
      case TransactionStatus.PENDING:
        return PaymentStatus.PENDING;
      case TransactionStatus.FAILED:
        return PaymentStatus.FAILED;
      case TransactionStatus.CANCELLED:
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
