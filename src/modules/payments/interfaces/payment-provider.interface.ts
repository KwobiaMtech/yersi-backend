export enum PaymentProviderType {
  SEEVCASH = 'seevcash',
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface DepositRequest {
  phoneNumber: string;
  amount: number;
  accountName: string;
  mobileMoneyProvider: string;
  referenceId: string;
  currency: string;
}

export interface DepositResponse {
  transactionId: string;
  status: TransactionStatus;
  providerReferenceId?: string;
  createdAt: string;
  feeAmount?: number;
  feeBearer?: string;
  userAmount?: number;
  customerFee?: number;
}

export interface WithdrawRequest {
  phoneNumber: string;
  amount: number;
  accountName: string;
  mobileMoneyProvider: string;
  referenceId: string;
  currency: string;
}

export interface WithdrawResponse {
  transactionId: string;
  status: TransactionStatus;
  providerReferenceId?: string;
  createdAt: string;
}

export interface TransactionStatusResponse {
  transactionId: string;
  status: TransactionStatus;
}

export interface WalletBalanceResponse {
  balance: number;
  currency: string;
}

export interface IPaymentProvider {
  deposit(request: DepositRequest): Promise<DepositResponse>;
  withdraw(request: WithdrawRequest): Promise<WithdrawResponse>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse>;
  getWalletBalance(currency: string): Promise<WalletBalanceResponse>;
}
