import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsService } from './services/payment-methods.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MobileMoneyProvider, PaymentMethodType } from './dto/payment-method.dto';

describe('Payment Methods Service', () => {
  let service: PaymentMethodsService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
    
    // Mock context
    Object.defineProperty(service, 'context', {
      get: () => ({ userId: 'test-user-id' }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addMobileMoneyMethod', () => {
    it('should add MTN mobile money method successfully', async () => {
      mockCacheManager.get.mockResolvedValue([]); // No existing methods
      mockCacheManager.set.mockResolvedValue(undefined);

      const addMethodDto = {
        phoneNumber: '+233555000006',
        accountName: 'John Doe',
        provider: MobileMoneyProvider.MTN,
        setAsDefault: true,
        nickname: 'My MTN Account',
      };

      const result = await service.addMobileMoneyMethod(addMethodDto);

      expect(result.type).toBe(PaymentMethodType.MOBILE_MONEY);
      expect(result.displayName).toBe('MTN Mobile Money');
      expect(result.maskedDetails).toBe('+233**006');
      expect(result.isDefault).toBe(true);
      expect(result.isVerified).toBe(false);
      expect(result.nickname).toBe('My MTN Account');
      expect(result.provider).toBe(MobileMoneyProvider.MTN);
    });

    it('should add Telecel mobile money method', async () => {
      mockCacheManager.get.mockResolvedValue([]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const addMethodDto = {
        phoneNumber: '0501234567',
        accountName: 'Jane Smith',
        provider: MobileMoneyProvider.TELECEL,
      };

      const result = await service.addMobileMoneyMethod(addMethodDto);

      expect(result.displayName).toBe('Telecel Cash');
      expect(result.maskedDetails).toBe('0**567');
      expect(result.provider).toBe(MobileMoneyProvider.TELECEL);
      expect(result.isDefault).toBe(true); // First method becomes default
    });

    it('should reject invalid phone number', async () => {
      const addMethodDto = {
        phoneNumber: '123456789', // Invalid format
        accountName: 'John Doe',
        provider: MobileMoneyProvider.MTN,
      };

      await expect(service.addMobileMoneyMethod(addMethodDto))
        .rejects.toThrow('Invalid Ghana phone number format');
    });

    it('should reject duplicate mobile money account', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          maskedDetails: '+233**006',
          isDefault: true,
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);

      const addMethodDto = {
        phoneNumber: '+233555000006', // Same number
        accountName: 'John Doe',
        provider: MobileMoneyProvider.MTN,
      };

      await expect(service.addMobileMoneyMethod(addMethodDto))
        .rejects.toThrow('This mobile money account is already added');
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update payment method nickname', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          displayName: 'MTN Mobile Money',
          maskedDetails: '+233**006',
          isDefault: true,
          isVerified: true,
          createdAt: new Date(),
          provider: MobileMoneyProvider.MTN,
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);
      mockCacheManager.set.mockResolvedValue(undefined);

      const updateDto = {
        nickname: 'Updated Nickname',
      };

      const result = await service.updatePaymentMethod('mm_1', updateDto);

      expect(result.nickname).toBe('Updated Nickname');
      expect(result.id).toBe('mm_1');
    });

    it('should set payment method as default', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          isDefault: true,
          isVerified: true,
          createdAt: new Date(),
        },
        {
          id: 'mm_2',
          type: PaymentMethodType.MOBILE_MONEY,
          isDefault: false,
          isVerified: true,
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);
      mockCacheManager.set.mockResolvedValue(undefined);

      const updateDto = {
        setAsDefault: true,
      };

      const result = await service.updatePaymentMethod('mm_2', updateDto);

      expect(result.isDefault).toBe(true);
      expect(result.id).toBe('mm_2');
    });

    it('should throw error for non-existent payment method', async () => {
      mockCacheManager.get.mockResolvedValue([]);

      const updateDto = {
        nickname: 'New Nickname',
      };

      await expect(service.updatePaymentMethod('non_existent', updateDto))
        .rejects.toThrow('Payment method not found');
    });
  });

  describe('verifyPaymentMethod', () => {
    it('should verify payment method with correct OTP', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          isVerified: false,
          isDefault: true,
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.verifyPaymentMethod('mm_1', '123456');

      expect(result.isVerified).toBe(true);
      expect(result.id).toBe('mm_1');
    });

    it('should reject incorrect OTP', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          isVerified: false,
          isDefault: true,
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);

      await expect(service.verifyPaymentMethod('mm_1', '000000'))
        .rejects.toThrow('Invalid OTP code');
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          isDefault: false,
          isVerified: true,
          createdAt: new Date(),
        },
        {
          id: 'mm_2',
          type: PaymentMethodType.MOBILE_MONEY,
          isDefault: true,
          isVerified: true,
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.deletePaymentMethod('mm_1');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'payment-methods-test-user-id',
        expect.arrayContaining([
          expect.objectContaining({ id: 'mm_2' })
        ]),
        3600
      );
    });

    it('should set new default when deleting default method', async () => {
      const existingMethods = [
        {
          id: 'mm_1',
          type: PaymentMethodType.MOBILE_MONEY,
          isDefault: true,
          isVerified: true,
          createdAt: new Date(),
        },
        {
          id: 'mm_2',
          type: PaymentMethodType.MOBILE_MONEY,
          isDefault: false,
          isVerified: true,
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValue(existingMethods);
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.deletePaymentMethod('mm_1');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'payment-methods-test-user-id',
        expect.arrayContaining([
          expect.objectContaining({ id: 'mm_2', isDefault: true })
        ]),
        3600
      );
    });
  });
});
