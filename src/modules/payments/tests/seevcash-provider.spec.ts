import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SeevcashProvider } from '../providers/seevcash.provider';
import { TransactionStatus } from '../interfaces/payment-provider.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SeevcashProvider', () => {
  let provider: SeevcashProvider;
  let configService: ConfigService;

  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          SEEVCASH_API_KEY: 'sk_test_key',
          SEEVCASH_BASE_URL: 'https://api-dev.seevcash.com/api/v1',
        };
        return config[key] || defaultValue;
      }),
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    provider = new SeevcashProvider(configService);
    
    // Mock the logger to suppress error logs
    (provider as any).logger = { log: jest.fn(), error: jest.fn() };
  });

  describe('deposit', () => {
    const depositRequest = {
      phoneNumber: '+233542853417',
      amount: 100,
      accountName: 'Patrick Oduro',
      mobileMoneyProvider: 'MTN',
      referenceId: 'YRS_123456',
      currency: 'GHS',
    };

    const mockDepositResponse = {
      transactionId: 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29',
      status: TransactionStatus.PENDING,
      providerReferenceId: '4630732381',
      createdAt: '2025-10-14T00:44:17.172Z',
      feeAmount: 0.15,
      feeBearer: 'customer',
      userAmount: 100.15,
      customerFee: 0.15,
      feeStructure: {
        percentageFee: 1.4,
        flatFee: 0,
        feeBearer: 'customer',
      },
    };

    it('should call deposit endpoint with correct data', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockDepositResponse });

      const result = await provider.deposit(depositRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/third-party/deposit',
        depositRequest
      );
      expect(result).toEqual(mockDepositResponse);
    });

    it('should handle deposit errors', async () => {
      const error = {
        response: {
          data: { message: 'Insufficient balance' },
        },
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(provider.deposit(depositRequest)).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(provider.deposit(depositRequest)).rejects.toThrow('Network error');
    });
  });

  describe('withdraw', () => {
    const withdrawRequest = {
      phoneNumber: '+233542853417',
      amount: 55,
      accountName: 'PATRICK ODURO',
      mobileMoneyProvider: 'MTN',
      referenceId: 'WTH_e5cedbdd-ab36-4276-80d3-bf43943e7dfa',
      currency: 'GHS',
    };

    const mockWithdrawResponse = {
      transactionId: 'WTH_67890',
      status: TransactionStatus.PENDING,
      providerReferenceId: 'ZP_987654321',
      createdAt: '2025-10-10T18:25:53.887Z',
    };

    it('should call withdraw endpoint with correct data', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockWithdrawResponse });

      const result = await provider.withdraw(withdrawRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/third-party/withdraw',
        withdrawRequest
      );
      expect(result).toEqual(mockWithdrawResponse);
    });

    it('should handle withdraw errors', async () => {
      const error = {
        response: {
          data: { message: 'Invalid account' },
        },
      };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(provider.withdraw(withdrawRequest)).rejects.toEqual(error);
    });
  });

  describe('getTransactionStatus', () => {
    const transactionId = 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29';

    const mockStatusResponse = {
      transactionId,
      status: TransactionStatus.SUCCESS,
    };

    it('should call status endpoint with correct transaction ID', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockStatusResponse });

      const result = await provider.getTransactionStatus(transactionId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/third-party/status/${transactionId}`
      );
      expect(result).toEqual(mockStatusResponse);
    });

    it('should handle different status values', async () => {
      const statuses = [
        TransactionStatus.PENDING,
        TransactionStatus.SUCCESS,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ];

      for (const status of statuses) {
        mockAxiosInstance.get.mockResolvedValue({
          data: { transactionId, status },
        });

        const result = await provider.getTransactionStatus(transactionId);
        expect(result.status).toBe(status);
      }
    });

    it('should handle status check errors', async () => {
      const error = {
        response: {
          data: { message: 'Transaction not found' },
        },
      };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(provider.getTransactionStatus(transactionId)).rejects.toEqual(error);
    });
  });

  describe('getWalletBalance', () => {
    const mockBalanceResponse = {
      balance: 153.6172429999997,
      currency: 'GHS',
    };

    it('should call balance endpoint with correct currency', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockBalanceResponse });

      const result = await provider.getWalletBalance('GHS');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/third-party/wallet/balance/GHS'
      );
      expect(result).toEqual(mockBalanceResponse);
    });

    it('should handle different currencies', async () => {
      const currencies = ['GHS', 'USD', 'EUR'];

      for (const currency of currencies) {
        mockAxiosInstance.get.mockResolvedValue({
          data: { balance: 100, currency },
        });

        const result = await provider.getWalletBalance(currency);
        expect(result.currency).toBe(currency);
      }
    });

    it('should handle balance check errors', async () => {
      const error = {
        response: {
          data: { message: 'Invalid currency' },
        },
      };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(provider.getWalletBalance('GHS')).rejects.toEqual(error);
    });
  });

  describe('Axios Configuration', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api-dev.seevcash.com/api/v1',
        headers: {
          'x-api-key': 'sk_test_key',
          'Content-Type': 'application/json',
        },
      });
    });
  });
});
