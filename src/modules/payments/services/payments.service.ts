import { Injectable } from '@nestjs/common';
import { OrdersService } from '../../orders/services/orders.service';
import { UsersService } from '../../users/services/users.service';
import { InitializePaymentDto } from '../dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private ordersService: OrdersService,
    private usersService: UsersService,
  ) {}

  async initializePayment(paymentDto: InitializePaymentDto) {
    const order = await this.ordersService.getOrderById(paymentDto.orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Mock payment initialization
    const payment = {
      id: 'pay_123',
      orderId: paymentDto.orderId,
      amount: 25.50, // Mock amount
      status: 'pending',
      paymentMethod: paymentDto.paymentMethod,
      reference: `REF_${Date.now()}`,
    };

    return payment;
  }

  async processPayment(paymentId: string, paymentMethod: string) {
    // Mock payment processing
    if (paymentMethod === 'credits') {
      // Mock credit deduction
      await this.usersService.updateUserCredits(-25.50);
    }

    return {
      success: true,
      paymentId,
      status: 'completed',
    };
  }

  async getPaymentHistory() {
    // Mock payment history
    return [
      {
        id: 'pay_123',
        amount: 25.50,
        status: 'completed',
        date: new Date(),
      },
    ];
  }
}
