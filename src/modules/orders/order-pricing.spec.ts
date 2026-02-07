import { Test, TestingModule } from '@nestjs/testing';
import { OrderMappingService } from './services/order-mapping.service';
import { OrderStatus } from './schemas/order.schema';

describe('Order Pricing Calculation', () => {
  let orderMappingService: OrderMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderMappingService],
    }).compile();

    orderMappingService = module.get<OrderMappingService>(OrderMappingService);
  });

  describe('toCreateData - Total Calculation', () => {
    it('should calculate total as subtotal + deliveryFee - promoDiscount', () => {
      const createOrderDto = {
        serviceId: 'service1',
        vendorId: 'vendor1',
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'top',
            categoryId: 'cat1',
            quantity: 2,
            weight: 0.5,
          },
        ],
        pickupAddress: {
          street: '123 Main St',
          city: 'Accra',
          region: 'Greater Accra',
          phone: '0241234567',
        },
        deliveryAddress: {
          street: '456 Oak Ave',
          city: 'Accra',
          region: 'Greater Accra',
          phone: '0241234567',
        },
      };

      const calculation = {
        totalWeight: 1.0,
        totalItems: 2,
        subtotal: 50,
        deliveryFee: 10,
        promoDiscount: 5,
        estimatedMinTotal: 44,
        estimatedMaxTotal: 66,
        currency: 'GHS',
        needsAdditionalAmount: 0,
        minimumOrderMet: true,
      };

      const service = {
        basePrice: 25,
      };

      const result = orderMappingService.toCreateData(
        createOrderDto as any,
        calculation,
        'user123',
        service
      );

      // Verify: total = subtotal + deliveryFee - promoDiscount
      // total = 50 + 10 - 5 = 55
      expect(result.total).toBe(55);
      expect(result.subtotal).toBe(50);
      expect(result.deliveryFee).toBe(10);
      expect(result.promoDiscount).toBe(5);
    });

    it('should calculate total without promo discount', () => {
      const createOrderDto = {
        serviceId: 'service1',
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'top',
            categoryId: 'cat1',
            quantity: 1,
            weight: 1.0,
          },
        ],
        pickupAddress: {} as any,
        deliveryAddress: {} as any,
      };

      const calculation = {
        totalWeight: 1.0,
        totalItems: 1,
        subtotal: 100,
        deliveryFee: 8,
        promoDiscount: 0,
        estimatedMinTotal: 86,
        estimatedMaxTotal: 130,
        currency: 'GHS',
        needsAdditionalAmount: 0,
        minimumOrderMet: true,
      };

      const service = { basePrice: 100 };

      const result = orderMappingService.toCreateData(
        createOrderDto as any,
        calculation,
        'user123',
        service
      );

      // Verify: total = subtotal + deliveryFee
      // total = 100 + 8 = 108
      expect(result.total).toBe(108);
      expect(result.subtotal).toBe(100);
      expect(result.deliveryFee).toBe(8);
      expect(result.promoDiscount).toBe(0);
    });

    it('should handle different delivery fees', () => {
      const createOrderDto = {
        serviceId: 'service1',
        vendorId: 'vendor1',
        items: [
          {
            itemId: 'item1',
            name: 'Pants',
            category: 'bottom',
            categoryId: 'cat2',
            quantity: 3,
            weight: 0.8,
          },
        ],
        pickupAddress: {} as any,
        deliveryAddress: {} as any,
      };

      const calculation = {
        totalWeight: 2.4,
        totalItems: 3,
        subtotal: 72,
        deliveryFee: 15,
        promoDiscount: 0,
        estimatedMinTotal: 70,
        estimatedMaxTotal: 105,
        currency: 'GHS',
        needsAdditionalAmount: 0,
        minimumOrderMet: false,
      };

      const service = { basePrice: 30 };

      const result = orderMappingService.toCreateData(
        createOrderDto as any,
        calculation,
        'user123',
        service
      );

      // Verify: total = subtotal + deliveryFee
      // total = 72 + 15 = 87
      expect(result.total).toBe(87);
      expect(result.subtotal).toBe(72);
      expect(result.deliveryFee).toBe(15);
    });
  });
});
