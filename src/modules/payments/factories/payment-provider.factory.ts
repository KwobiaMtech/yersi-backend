import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentProviderType,
} from '../interfaces/payment-provider.interface';
import { SeevcashProvider } from '../providers/seevcash.provider';

@Injectable()
export class PaymentProviderFactory {
  private readonly logger = new Logger(PaymentProviderFactory.name);
  private readonly activeProvider: PaymentProviderType;

  constructor(
    private configService: ConfigService,
    private seevcashProvider: SeevcashProvider,
  ) {
    this.activeProvider = this.configService.get<PaymentProviderType>(
      'PAYMENT_PROVIDER',
      PaymentProviderType.SEEVCASH,
    );
    this.logger.log(`Active payment provider: ${this.activeProvider}`);
  }

  getProvider(): IPaymentProvider {
    switch (this.activeProvider) {
      case PaymentProviderType.SEEVCASH:
        return this.seevcashProvider;
      
      case PaymentProviderType.PAYSTACK:
        // return this.paystackProvider;
        throw new Error('Paystack provider not implemented');
      
      case PaymentProviderType.FLUTTERWAVE:
        // return this.flutterwaveProvider;
        throw new Error('Flutterwave provider not implemented');
      
      default:
        throw new Error(`Unknown payment provider: ${this.activeProvider}`);
    }
  }
}
