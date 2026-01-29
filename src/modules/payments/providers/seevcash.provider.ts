import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IPaymentProvider,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  TransactionStatusResponse,
  WalletBalanceResponse,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class SeevcashProvider implements IPaymentProvider {
  private readonly logger = new Logger(SeevcashProvider.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SEEVCASH_API_KEY');
    const baseURL = this.configService.get<string>('SEEVCASH_BASE_URL', 'https://api-dev.seevcash.com/api/v1');

    this.client = axios.create({
      baseURL,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async deposit(request: DepositRequest): Promise<DepositResponse> {
    try {
      const { data } = await this.client.post('/third-party/deposit', request);
      this.logger.log(`Deposit initiated: ${data.transactionId}`);
      return data;
    } catch (error) {
      this.logger.error('Deposit failed', error.response?.data || error.message);
      throw error;
    }
  }

  async withdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
    try {
      const { data } = await this.client.post('/third-party/withdraw', request);
      this.logger.log(`Withdrawal initiated: ${data.transactionId}`);
      return data;
    } catch (error) {
      this.logger.error('Withdrawal failed', error.response?.data || error.message);
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
    try {
      const { data } = await this.client.get(`/third-party/status/${transactionId}`);
      return data;
    } catch (error) {
      this.logger.error(`Status check failed for ${transactionId}`, error.response?.data || error.message);
      throw error;
    }
  }

  async getWalletBalance(currency: string): Promise<WalletBalanceResponse> {
    try {
      const { data } = await this.client.get(`/third-party/wallet/balance/${currency}`);
      return data;
    } catch (error) {
      this.logger.error(`Balance check failed for ${currency}`, error.response?.data || error.message);
      throw error;
    }
  }
}
