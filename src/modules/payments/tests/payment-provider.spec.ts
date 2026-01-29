import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { SeevcashProvider } from '../providers/seevcash.provider';
import { PaymentProviderFactory } from '../factories/payment-provider.factory';
import { PaymentsService } from '../services/payments.service';
import { PaymentProviderType, TransactionStatus } from '../interfaces/payment-provider.interface';
import { Payment, PaymentStatus } from '../schemas/payment.schema';
import { OrdersService } from '../../orders/services/orders.service';
import { UsersService } from '../../users/services/users.service';

describe('Payment Integration Tests', () => {
  let paymentsService: PaymentsService;
  let seevcashProvider: SeevcashProvider;
  let factory: PaymentProviderFactory;
  let paymentModel: any;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        PAYMENT_PROVIDER: PaymentProviderType.SEEVCASH,
        SEEVCASH_API_KEY: 'sk_test_key',
        SEEVCASH_BASE_URL: 'https://api-dev.seevcash.com/api/v1',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockOrdersService = {
    getOrderById: jest.fn(),
  };

  const mockUsersService = {
    updateUserCredits: jest.fn(),
  };

  const mockPaymentModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockOrder = {
    _id: 'order-123',
    userId: 'user-123',
    total: 100,
    currency: 'GHS',
    orderNumber: 'YRS123456',
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
  };

  const mockPayment = {
    _id: 'payment-123',
    orderId: 'order-123',
    userId: 'user-123',
    amount: 100,
    currency: 'GHS',
    paymentMethod: 'mobile_money',
    status: PaymentStatus.PENDING,
    transactionId: 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29',
    phone: '+233542853417',
    network: 'MTN',
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        SeevcashProvider,
        PaymentProviderFactory,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .setLogger({ log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn() } as any)
      .compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    seevcashProvider = module.get<SeevcashProvider>(SeevcashProvider);
    factory = module.get<PaymentProviderFactory>(PaymentProviderFactory);
    paymentModel = module.get(getModelToken(Payment.name));
  });

  describe('PaymentProviderFactory', () => {
    it('should return SeevcashProvider when configured', () => {
      const provider = factory.getProvider();
      expect(provider).toBeInstanceOf(SeevcashProvider);
    });

    it('should throw error for unimplemented providers', () => {
      jest.spyOn(mockConfigService, 'get').mockReturnValueOnce(PaymentProviderType.PAYSTACK);
      const newFactory = new PaymentProviderFactory(mockConfigService as any, seevcashProvider);
      expect(() => newFactory.getProvider()).toThrow('Paystack provider not implemented');
    });
  });

  describe('SeevcashProvider', () => {
    it('should have all required methods', () => {
      expect(seevcashProvider.deposit).toBeDefined();
      expect(seevcashProvider.withdraw).toBeDefined();
      expect(seevcashProvider.getTransactionStatus).toBeDefined();
      expect(seevcashProvider.getWalletBalance).toBeDefined();
    });
  });

  describe('PaymentsService - initializePayment', () => {
    const initializeDto = {
      orderId: 'order-123',
      paymentMethod: 'mobile_money' as any,
      phoneNumber: '+233542853417',
      accountName: 'Patrick Oduro',
      mobileMoneyProvider: 'MTN',
    };

    beforeEach(() => {
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockPaymentModel.create.mockResolvedValue(mockPayment);
    });

    it('should initialize payment successfully', async () => {
      jest.spyOn(seevcashProvider, 'deposit').mockResolvedValue(mockDepositResponse);

      const result = await paymentsService.initializePayment(initializeDto);

      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(seevcashProvider.deposit).toHaveBeenCalledWith({
        phoneNumber: '+233542853417',
        amount: 100,
        accountName: 'Patrick Oduro',
        mobileMoneyProvider: 'MTN',
        referenceId: expect.stringContaining('YRS_'),
        currency: 'GHS',
      });
      expect(mockPaymentModel.create).toHaveBeenCalledWith({
        orderId: 'order-123',
        userId: 'user-123',
        amount: 100,
        currency: 'GHS',
        paymentMethod: 'mobile_money',
        status: PaymentStatus.PENDING,
        transactionId: 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29',
        phone: '+233542853417',
        network: 'MTN',
        gatewayResponse: mockDepositResponse,
      });
      expect(result).toEqual({
        paymentId: 'payment-123',
        transactionId: 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29',
        status: TransactionStatus.PENDING,
        amount: 100,
        feeAmount: 0.15,
        userAmount: 100.15,
        reference: expect.stringContaining('YRS_'),
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(null);

      await expect(paymentsService.initializePayment(initializeDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deposit fails', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      jest.spyOn(seevcashProvider, 'deposit').mockRejectedValue(new Error('API Error'));

      await expect(paymentsService.initializePayment(initializeDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should generate unique reference ID', async () => {
      jest.spyOn(seevcashProvider, 'deposit').mockResolvedValue(mockDepositResponse);

      const result = await paymentsService.initializePayment(initializeDto);

      expect(result.reference).toMatch(/^YRS_\d+_order-123$/);
    });
  });

  describe('PaymentsService - checkPaymentStatus', () => {
    const transactionId = 'DEP_38e955df-884d-4b24-9aa4-173b84c57c29';

    beforeEach(() => {
      const mockPaymentDoc = {
        ...mockPayment,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc);
    });

    it('should check payment status successfully', async () => {
      const statusResponse = {
        transactionId,
        status: TransactionStatus.SUCCESS,
      };
      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue(statusResponse);

      const result = await paymentsService.checkPaymentStatus(transactionId);

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({ transactionId });
      expect(seevcashProvider.getTransactionStatus).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual({
        transactionId,
        status: TransactionStatus.SUCCESS,
        paymentId: 'payment-123',
      });
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPaymentModel.findOne.mockReturnValue(null);

      await expect(paymentsService.checkPaymentStatus(transactionId))
        .rejects.toThrow(NotFoundException);
    });

    it('should update payment status correctly', async () => {
      const mockPaymentDoc = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc);

      const statusResponse = {
        transactionId,
        status: TransactionStatus.SUCCESS,
      };
      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue(statusResponse);

      await paymentsService.checkPaymentStatus(transactionId);

      expect(mockPaymentDoc.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPaymentDoc.save).toHaveBeenCalled();
    });

    it('should handle FAILED status', async () => {
      const mockPaymentDoc = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc);

      const statusResponse = {
        transactionId,
        status: TransactionStatus.FAILED,
      };
      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue(statusResponse);

      await paymentsService.checkPaymentStatus(transactionId);

      expect(mockPaymentDoc.status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('PaymentsService - getWalletBalance', () => {
    it('should get wallet balance successfully', async () => {
      const balanceResponse = {
        balance: 153.62,
        currency: 'GHS',
      };
      jest.spyOn(seevcashProvider, 'getWalletBalance').mockResolvedValue(balanceResponse);

      const result = await paymentsService.getWalletBalance('GHS');

      expect(seevcashProvider.getWalletBalance).toHaveBeenCalledWith('GHS');
      expect(result).toEqual(balanceResponse);
    });

    it('should use default currency when not provided', async () => {
      const balanceResponse = {
        balance: 153.62,
        currency: 'GHS',
      };
      jest.spyOn(seevcashProvider, 'getWalletBalance').mockResolvedValue(balanceResponse);

      await paymentsService.getWalletBalance();

      expect(seevcashProvider.getWalletBalance).toHaveBeenCalledWith('GHS');
    });
  });

  describe('PaymentsService - getPaymentHistory', () => {
    it('should get payment history for user', async () => {
      const mockPayments = [
        { ...mockPayment, createdAt: new Date() },
        { ...mockPayment, _id: 'payment-456', createdAt: new Date() },
      ];
      mockPaymentModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockPayments),
          }),
        }),
      });

      const result = await paymentsService.getPaymentHistory('user-123');

      expect(mockPaymentModel.find).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('Status Mapping', () => {
    it('should map PENDING status correctly', async () => {
      const mockPaymentDoc = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc);

      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue({
        transactionId: 'DEP_123',
        status: TransactionStatus.PENDING,
      });

      await paymentsService.checkPaymentStatus('DEP_123');

      expect(mockPaymentDoc.status).toBe(PaymentStatus.PENDING);
    });

    it('should map SUCCESS status correctly', async () => {
      const mockPaymentDoc = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc);

      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue({
        transactionId: 'DEP_123',
        status: TransactionStatus.SUCCESS,
      });

      await paymentsService.checkPaymentStatus('DEP_123');

      expect(mockPaymentDoc.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should map CANCELLED status correctly', async () => {
      const mockPaymentDoc = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc);

      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue({
        transactionId: 'DEP_123',
        status: TransactionStatus.CANCELLED,
      });

      await paymentsService.checkPaymentStatus('DEP_123');

      expect(mockPaymentDoc.status).toBe(PaymentStatus.CANCELLED);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete payment flow', async () => {
      // Step 1: Initialize payment
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockPaymentModel.create.mockResolvedValue(mockPayment);
      jest.spyOn(seevcashProvider, 'deposit').mockResolvedValue(mockDepositResponse);

      const initResult = await paymentsService.initializePayment({
        orderId: 'order-123',
        paymentMethod: 'mobile_money' as any,
        phoneNumber: '+233542853417',
        accountName: 'Patrick Oduro',
        mobileMoneyProvider: 'MTN',
      });

      expect(initResult.status).toBe(TransactionStatus.PENDING);

      // Step 2: Check status (still pending)
      const mockPaymentDoc1 = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc1);

      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue({
        transactionId: initResult.transactionId,
        status: TransactionStatus.PENDING,
      });

      const statusResult1 = await paymentsService.checkPaymentStatus(initResult.transactionId);
      expect(statusResult1.status).toBe(TransactionStatus.PENDING);

      // Step 3: Check status (now success)
      const mockPaymentDoc2 = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(mockPayment),
      };
      mockPaymentModel.findOne.mockReturnValue(mockPaymentDoc2);

      jest.spyOn(seevcashProvider, 'getTransactionStatus').mockResolvedValue({
        transactionId: initResult.transactionId,
        status: TransactionStatus.SUCCESS,
      });

      const statusResult2 = await paymentsService.checkPaymentStatus(initResult.transactionId);
      expect(statusResult2.status).toBe(TransactionStatus.SUCCESS);
    });

    it('should handle multiple payment methods', async () => {
      const providers = ['MTN', 'VODAFONE', 'AIRTELTIGO'];
      
      for (const provider of providers) {
        mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
        mockPaymentModel.create.mockResolvedValue(mockPayment);
        jest.spyOn(seevcashProvider, 'deposit').mockResolvedValue(mockDepositResponse);

        const result = await paymentsService.initializePayment({
          orderId: 'order-123',
          paymentMethod: 'mobile_money' as any,
          phoneNumber: '+233542853417',
          accountName: 'Test User',
          mobileMoneyProvider: provider,
        });

        expect(result.transactionId).toBeDefined();
      }
    });
  });
});
