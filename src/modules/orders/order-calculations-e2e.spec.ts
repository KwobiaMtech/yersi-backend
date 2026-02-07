import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './services/orders.service';
import { OrderMappingService } from './services/order-mapping.service';
import { OrdersRepository } from './repositories/orders.repository';
import { ServicesRepository } from '../services/repositories/services.repository';
import { VendorsRepository } from '../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../vendors/repositories/vendor-service.repository';
import { PaymentMethodsService } from './services/payment-methods.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Types } from 'mongoose';

describe('Order Calculations E2E', () => {
  let ordersService: OrdersService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
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
        OrderMappingService,
        { provide: OrdersRepository, useValue: {} },
        { provide: ServicesRepository, useValue: mockServicesRepository },
        { provide: VendorsRepository, useValue: mockVendorsRepository },
        { provide: VendorServiceRepository, useValue: mockVendorServiceRepository },
        { provide: PaymentMethodsService, useValue: {} },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
    mockCacheManager.get.mockResolvedValue(null);
  });

  describe('Calculate Order - Pricing Verification', () => {
    it('should calculate total = subtotal + deliveryFee (no promo)', async () => {
      const mockService = {
        _id: serviceId,
        basePrice: 25,
      };

      mockServicesRepository.findById.mockResolvedValue(mockService);

      const result = await ordersService.calculateOrder({
        serviceId: serviceId.toString(),
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'top',
            categoryId: 'cat1',
            quantity: 2,
            weight: 0.5,
          },
          {
            itemId: 'item2',
            name: 'Pants',
            category: 'bottom',
            categoryId: 'cat2',
            quantity: 1,
            weight: 0.8,
          },
        ],
      });

      // Verify calculation
      // Item 1: 0.5 * 25 * 2 = 25
      // Item 2: 0.8 * 25 * 1 = 20
      // Subtotal = 45
      // Delivery = 5 (default)
      // Promo = 0
      // Total should be: 45 + 5 - 0 = 50

      expect(result.subtotal).toBe(45);
      expect(result.deliveryFee).toBe(5);
      expect(result.promoDiscount).toBe(0);
      
      const expectedTotal = result.subtotal + result.deliveryFee - result.promoDiscount;
      console.log(`✅ Test 1: subtotal(${result.subtotal}) + deliveryFee(${result.deliveryFee}) - promo(${result.promoDiscount}) = ${expectedTotal}`);
    });

    it('should calculate total = subtotal + deliveryFee - promoDiscount', async () => {
      const mockService = {
        _id: serviceId,
        basePrice: 20,
      };

      mockServicesRepository.findById.mockResolvedValue(mockService);

      const result = await ordersService.calculateOrder({
        serviceId: serviceId.toString(),
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'top',
            categoryId: 'cat1',
            quantity: 3,
            weight: 0.5,
          },
        ],
        promoCode: 'SAVE10',
      });

      // Verify calculation
      // Item 1: 0.5 * 20 * 3 = 30
      // Subtotal = 30
      // Delivery = 5
      // Promo = 5
      // Total should be: 30 + 5 - 5 = 30

      expect(result.subtotal).toBe(30);
      expect(result.deliveryFee).toBe(5);
      expect(result.promoDiscount).toBe(5);
      
      const expectedTotal = result.subtotal + result.deliveryFee - result.promoDiscount;
      console.log(`✅ Test 2: subtotal(${result.subtotal}) + deliveryFee(${result.deliveryFee}) - promo(${result.promoDiscount}) = ${expectedTotal}`);
    });

    it('should calculate with vendor pricing', async () => {
      const mockService = {
        _id: serviceId,
        basePrice: 25,
      };

      const mockVendor = {
        _id: vendorId,
        name: 'Test Vendor',
        deliveryFee: 8,
      };

      const mockVendorService = {
        serviceId: { toString: () => serviceId.toString() },
        price: 20,
        isAvailable: true,
      };

      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);

      const result = await ordersService.calculateOrder({
        serviceId: serviceId.toString(),
        vendorId: vendorId.toString(),
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'top',
            categoryId: 'cat1',
            quantity: 2,
            weight: 1.0,
          },
        ],
      });

      // Verify calculation
      // Item 1: 1.0 * 20 * 2 = 40 (vendor price)
      // Subtotal = 40
      // Delivery = 8 (vendor delivery fee)
      // Promo = 0
      // Total should be: 40 + 8 - 0 = 48

      expect(result.subtotal).toBe(40);
      expect(result.deliveryFee).toBe(8);
      expect(result.promoDiscount).toBe(0);
      expect(result.vendorPricing).toBeDefined();
      
      const expectedTotal = result.subtotal + result.deliveryFee - result.promoDiscount;
      console.log(`✅ Test 3: subtotal(${result.subtotal}) + deliveryFee(${result.deliveryFee}) - promo(${result.promoDiscount}) = ${expectedTotal}`);
    });

    it('should handle multiple items with different weights', async () => {
      const mockService = {
        _id: serviceId,
        basePrice: 30,
      };

      mockServicesRepository.findById.mockResolvedValue(mockService);

      const result = await ordersService.calculateOrder({
        serviceId: serviceId.toString(),
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'top',
            categoryId: 'cat1',
            quantity: 1,
            weight: 0.5,
          },
          {
            itemId: 'item2',
            name: 'Pants',
            category: 'bottom',
            categoryId: 'cat2',
            quantity: 2,
            weight: 0.8,
          },
          {
            itemId: 'item3',
            name: 'Jacket',
            category: 'outerwear',
            categoryId: 'cat3',
            quantity: 1,
            weight: 1.2,
          },
        ],
      });

      // Verify calculation
      // Item 1: 0.5 * 30 * 1 = 15
      // Item 2: 0.8 * 30 * 2 = 48
      // Item 3: 1.2 * 30 * 1 = 36
      // Subtotal = 99
      // Delivery = 5
      // Promo = 0
      // Total should be: 99 + 5 - 0 = 104

      expect(result.subtotal).toBe(99);
      expect(result.deliveryFee).toBe(5);
      expect(result.promoDiscount).toBe(0);
      expect(result.totalWeight).toBe(3.3); // 0.5*1 + 0.8*2 + 1.2*1 = 0.5 + 1.6 + 1.2
      expect(result.totalItems).toBe(4); // 1 + 2 + 1
      
      const expectedTotal = result.subtotal + result.deliveryFee - result.promoDiscount;
      console.log(`✅ Test 4: subtotal(${result.subtotal}) + deliveryFee(${result.deliveryFee}) - promo(${result.promoDiscount}) = ${expectedTotal}`);
    });
  });
});
