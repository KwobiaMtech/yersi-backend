import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './services/orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { ServicesRepository } from '../services/repositories/services.repository';
import { VendorsRepository } from '../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../vendors/repositories/vendor-service.repository';
import { OrderMappingService } from './services/order-mapping.service';
import { PaymentMethodsService } from './services/payment-methods.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Types } from 'mongoose';

describe('PromoCode Optional Flow', () => {
  let ordersService: OrdersService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockServicesRepository = {
    findById: jest.fn(),
  };

  const mockVendorsRepository = {
    findById: jest.fn(),
  };

  const mockVendorServiceRepository = {
    findByVendorId: jest.fn(),
  };

  const serviceId = new Types.ObjectId();
  const vendorId = new Types.ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: {} },
        { provide: ServicesRepository, useValue: mockServicesRepository },
        { provide: VendorsRepository, useValue: mockVendorsRepository },
        { provide: VendorServiceRepository, useValue: mockVendorServiceRepository },
        { provide: OrderMappingService, useValue: {} },
        { provide: PaymentMethodsService, useValue: {} },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('calculateOrder', () => {
    const mockService = {
      _id: serviceId,
      name: 'Laundry Service',
      basePrice: 10,
    };

    const mockVendor = {
      _id: vendorId,
      name: 'Test Vendor',
      deliveryFee: 8,
    };

    const mockVendorService = {
      serviceId: { toString: () => serviceId.toString() },
      price: 12,
      isAvailable: true,
    };

    const calculateDto = {
      serviceId: serviceId.toString(),
      vendorId: vendorId.toString(),
      items: [
        {
          itemId: 'item1',
          name: 'Shirt',
          category: 'Tops',
          categoryId: 'cat1',
          quantity: 2,
          weight: 0.5,
        },
      ],
    };

    beforeEach(() => {
      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
    });

    it('should calculate order without promo code', async () => {
      const result = await ordersService.calculateOrder(calculateDto);

      expect(result).toBeDefined();
      expect(result.promoDiscount).toBe(0);
      expect(result.subtotal).toBe(12);
      expect(result.deliveryFee).toBe(8);
      expect(result.estimatedMinTotal).toBe(Math.round(12 * 0.8 + 8));
      expect(result.estimatedMaxTotal).toBe(Math.round(12 * 1.2 + 8));
    });

    it('should calculate order with promo code', async () => {
      const result = await ordersService.calculateOrder({
        ...calculateDto,
        promoCode: 'SAVE10',
      });

      expect(result).toBeDefined();
      expect(result.promoDiscount).toBe(5);
      expect(result.subtotal).toBe(12);
      expect(result.deliveryFee).toBe(8);
      expect(result.estimatedMinTotal).toBe(Math.round(12 * 0.8 + 8 - 5));
      expect(result.estimatedMaxTotal).toBe(Math.round(12 * 1.2 + 8 - 5));
    });

    it('should calculate order with empty promo code as no discount', async () => {
      const result = await ordersService.calculateOrder({
        ...calculateDto,
        promoCode: '',
      });

      expect(result).toBeDefined();
      expect(result.promoDiscount).toBe(0);
    });

    it('should calculate order with undefined promo code', async () => {
      const result = await ordersService.calculateOrder({
        ...calculateDto,
        promoCode: undefined,
      });

      expect(result).toBeDefined();
      expect(result.promoDiscount).toBe(0);
    });
  });
});
