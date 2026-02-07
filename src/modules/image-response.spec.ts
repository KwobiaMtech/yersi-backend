import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from '../modules/items/services/items.service';
import { ItemsRepository } from '../modules/items/repositories/items.repository';
import { OrderMappingService } from '../modules/orders/services/order-mapping.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClothingCategory } from '../modules/items/schemas/item.schema';
import { OrderStatus } from '../modules/orders/schemas/order.schema';
import { Types } from 'mongoose';

describe('Image Response Verification', () => {
  let itemsService: ItemsService;
  let orderMappingService: OrderMappingService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        OrderMappingService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { 
          provide: ItemsRepository, 
          useValue: {
            findByIds: jest.fn(),
            findByServiceId: jest.fn(),
          } 
        },
      ],
    }).compile();

    itemsService = module.get<ItemsService>(ItemsService);
    orderMappingService = module.get<OrderMappingService>(OrderMappingService);
    jest.clearAllMocks();
  });

  describe('Items Flow - Returns Images', () => {
    it('should return icon field for all items', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await itemsService.getItemsByCategory({
        category: ClothingCategory.TOP,
      });

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      
      result.items.forEach(item => {
        expect(item).toHaveProperty('icon');
        expect(item.icon).toBeDefined();
        expect(typeof item.icon).toBe('string');
      });
    });

    it('should return icons for different categories', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const categories = [
        ClothingCategory.TOP,
        ClothingCategory.BOTTOM,
      ];

      for (const category of categories) {
        const result = await itemsService.getItemsByCategory({ category });
        
        expect(result.items.length).toBeGreaterThan(0);
        result.items.forEach(item => {
          expect(item.icon).toBeDefined();
        });
      }
    });
  });

  describe('Order Flow - Returns Images or Default', () => {
    it('should return icon when item has icon', () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'YRS123456',
        status: OrderStatus.PENDING,
        userId: new Types.ObjectId(),
        serviceId: 'service1',
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'Tops',
            categoryId: 'cat1',
            quantity: 2,
            weight: 0.5,
            unitPrice: 10,
            total: 20,
            icon: 'https://s3.us-central-1.wasabisys.com/ys-uploads/items/test.png',
          },
        ],
        pickupAddress: {} as any,
        deliveryAddress: {} as any,
        subtotal: 20,
        totalWeight: 1,
        totalItems: 2,
        deliveryFee: 5,
        promoDiscount: 0,
        estimatedMinTotal: 20,
        estimatedMaxTotal: 30,
        total: 25,
        currency: 'GHS',
        progressPercentage: 0,
        lastStatusUpdate: new Date(),
      } as any;

      const response = orderMappingService.toResponse(mockOrder);

      expect(response.items).toBeDefined();
      expect(response.items[0].icon).toBe('https://s3.us-central-1.wasabisys.com/ys-uploads/items/test.png');
    });

    it('should return default image when item has no icon', () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'YRS123456',
        status: OrderStatus.PENDING,
        userId: new Types.ObjectId(),
        serviceId: 'service1',
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'Tops',
            categoryId: 'cat1',
            quantity: 2,
            weight: 0.5,
            unitPrice: 10,
            total: 20,
            // No icon field
          },
        ],
        pickupAddress: {} as any,
        deliveryAddress: {} as any,
        subtotal: 20,
        totalWeight: 1,
        totalItems: 2,
        deliveryFee: 5,
        promoDiscount: 0,
        estimatedMinTotal: 20,
        estimatedMaxTotal: 30,
        total: 25,
        currency: 'GHS',
        progressPercentage: 0,
        lastStatusUpdate: new Date(),
      } as any;

      const response = orderMappingService.toResponse(mockOrder);

      expect(response.items).toBeDefined();
      expect(response.items[0].icon).toBe('https://s3.us-central-1.wasabisys.com/ys-uploads/defaults/item-placeholder.png');
    });

    it('should return default image when icon is empty string', () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'YRS123456',
        status: OrderStatus.PENDING,
        userId: new Types.ObjectId(),
        serviceId: 'service1',
        items: [
          {
            itemId: 'item1',
            name: 'Shirt',
            category: 'Tops',
            categoryId: 'cat1',
            quantity: 2,
            weight: 0.5,
            unitPrice: 10,
            total: 20,
            icon: '',
          },
        ],
        pickupAddress: {} as any,
        deliveryAddress: {} as any,
        subtotal: 20,
        totalWeight: 1,
        totalItems: 2,
        deliveryFee: 5,
        promoDiscount: 0,
        estimatedMinTotal: 20,
        estimatedMaxTotal: 30,
        total: 25,
        currency: 'GHS',
        progressPercentage: 0,
        lastStatusUpdate: new Date(),
      } as any;

      const response = orderMappingService.toResponse(mockOrder);

      expect(response.items[0].icon).toBe('https://s3.us-central-1.wasabisys.com/ys-uploads/defaults/item-placeholder.png');
    });
  });
});
