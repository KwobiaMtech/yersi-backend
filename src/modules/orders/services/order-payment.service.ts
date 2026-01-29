import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../../payments/services/payments.service';
import { PaymentMethod } from '../dto/checkout.dto';

@Injectable()
export class OrderPaymentService {
  private readonly logger = new Logger(OrderPaymentService.name);

  constructor(private paymentsService: PaymentsService) {}

  async processOrderPayment(
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    paymentDetails?: {
      phoneNumber?: string;
      accountName?: string;
      mobileMoneyProvider?: string;
    }
  ) {
    switch (paymentMethod) {
      case PaymentMethod.MTN_MOBILE_MONEY:
      case PaymentMethod.VODAFONE_CASH:
      case PaymentMethod.AIRTELTIGO_MONEY:
        return this.processMobileMoneyPayment(orderId, amount, paymentDetails);
      
      case PaymentMethod.CASH_ON_DELIVERY:
        return this.processCashOnDelivery(orderId);
      
      case PaymentMethod.VISA_CARD:
      case PaymentMethod.MASTERCARD:
        return this.processCardPayment(orderId, amount, paymentDetails);
      
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  private async processMobileMoneyPayment(
    orderId: string,
    amount: number,
    paymentDetails: any
  ) {
    if (!paymentDetails?.phoneNumber || !paymentDetails?.accountName) {
      throw new BadRequestException('Phone number and account name required for mobile money');
    }

    const providerMap = {
      [PaymentMethod.MTN_MOBILE_MONEY]: 'MTN',
      [PaymentMethod.VODAFONE_CASH]: 'VODAFONE',
      [PaymentMethod.AIRTELTIGO_MONEY]: 'AIRTELTIGO',
    };

    try {
      const result = await this.paymentsService.initializePayment({
        orderId,
        paymentMethod: 'mobile_money' as any,
        phoneNumber: paymentDetails.phoneNumber,
        accountName: paymentDetails.accountName,
        mobileMoneyProvider: paymentDetails.mobileMoneyProvider,
      });

      return {
        reference: result.transactionId,
        paymentUrl: null,
        requiresConfirmation: true,
        transactionId: result.transactionId,
        status: result.status,
      };
    } catch (error) {
      this.logger.error('Mobile money payment failed', error);
      throw new BadRequestException('Failed to process mobile money payment');
    }
  }

  private async processCashOnDelivery(orderId: string) {
    return {
      reference: `COD_${Date.now()}`,
      requiresConfirmation: false,
    };
  }

  private async processCardPayment(orderId: string, amount: number, paymentDetails: any) {
    // Placeholder for card payment integration
    return {
      reference: `CARD_${Date.now()}`,
      paymentUrl: `https://card-processor.com/pay/${Date.now()}`,
      requiresConfirmation: true,
    };
  }
}
