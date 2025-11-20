import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './services/orders.service';
import { ServicesRepository } from '../services/repositories/services.repository';
import { VendorsRepository } from '../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../vendors/repositories/vendor-service.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('Vendor Pricing Functionality', () => {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ServicesRepository,
          useValue: mockServicesRepository,
        },
        {
          provide: VendorsRepository,
          useValue: mockVendorsRepository,
        },
        {
          provide: VendorServiceRepository,
          useValue: mockVendorServiceRepository,
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateOrder with vendor pricing', () => {
    it('should calculate order without vendor (base pricing)', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockCacheManager.set.mockResolvedValue(undefined);

      const calculateDto = {
        serviceId: '507f1f77bcf86cd799439020',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 2,
            weight: 0.5,
          },
        ],
      };

      const result = await ordersService.calculateOrder(calculateDto);

      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('deliveryFee');
      expect(result).toHaveProperty('totalWeight');
      expect(result).toHaveProperty('totalItems');
      expect(result.vendorPricing).toBeUndefined();
      expect(result.totalWeight).toBe(1); // 0.5 * 2
      expect(result.totalItems).toBe(2);
    });

    it('should calculate order with vendor pricing and show breakdown', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      const mockVendor = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Quick Wash',
        deliveryFee: 8,
      };

      const mockVendorService = {
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        price: 20, // Cheaper than base price
        isAvailable: true,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const calculateDto = {
        serviceId: '507f1f77bcf86cd799439020',
        vendorId: '507f1f77bcf86cd799439011',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 2,
            weight: 0.5,
          },
        ],
      };

      const result = await ordersService.calculateOrder(calculateDto);

      expect(result).toHaveProperty('vendorPricing');
      expect(result.vendorPricing).toHaveProperty('vendor');
      expect(result.vendorPricing).toHaveProperty('itemBreakdown');
      expect(result.vendorPricing).toHaveProperty('comparedToBase');

      // Verify vendor details
      expect(result.vendorPricing.vendor.name).toBe('Quick Wash');
      expect(result.vendorPricing.vendor.deliveryFee).toBe(8);

      // Verify item breakdown
      expect(result.vendorPricing.itemBreakdown).toHaveLength(1);
      const itemBreakdown = result.vendorPricing.itemBreakdown[0];
      expect(itemBreakdown.basePrice).toBe(25);
      expect(itemBreakdown.vendorPrice).toBe(20);
      expect(itemBreakdown.savings).toBe(5); // 25 - 20 per kg * 0.5kg * 2 items = 5
      expect(itemBreakdown.itemTotal).toBe(20); // 20 * 0.5 * 2

      // Verify pricing uses vendor rates
      expect(result.deliveryFee).toBe(8); // Vendor's delivery fee
      expect(result.subtotal).toBe(20); // Vendor's pricing: 20 * 0.5 * 2
    });

    it('should handle vendor that does not offer the service', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      const mockVendor = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Quick Wash',
        deliveryFee: 8,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([]); // No services

      const calculateDto = {
        serviceId: '507f1f77bcf86cd799439020',
        vendorId: '507f1f77bcf86cd799439011',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 1,
            weight: 0.5,
          },
        ],
      };

      await expect(ordersService.calculateOrder(calculateDto)).rejects.toThrow(
        'Vendor does not offer this service or service is unavailable'
      );
    });

    it('should show savings when vendor price is lower than base price', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 30,
      };

      const mockVendor = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Budget Wash',
        deliveryFee: 5,
      };

      const mockVendorService = {
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        price: 22, // Cheaper than base
        isAvailable: true,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const calculateDto = {
        serviceId: '507f1f77bcf86cd799439020',
        vendorId: '507f1f77bcf86cd799439011',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 1,
            weight: 1.0,
          },
        ],
      };

      const result = await ordersService.calculateOrder(calculateDto);

      expect(result.vendorPricing.comparedToBase).toBeGreaterThan(0); // Should show savings
      expect(result.vendorPricing.itemBreakdown[0].savings).toBe(8); // 30 - 22 = 8 per kg
    });
  });

  describe('Pricing consistency', () => {
    it('should calculate same pricing for identical requests', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      const mockVendor = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Quick Wash',
        deliveryFee: 8,
      };

      const mockVendorService = {
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        price: 20,
        isAvailable: true,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const calculateDto = {
        serviceId: '507f1f77bcf86cd799439020',
        vendorId: '507f1f77bcf86cd799439011',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 2,
            weight: 0.5,
          },
        ],
      };

      const result1 = await ordersService.calculateOrder(calculateDto);
      const result2 = await ordersService.calculateOrder(calculateDto);

      expect(result1.subtotal).toBe(result2.subtotal);
      expect(result1.deliveryFee).toBe(result2.deliveryFee);
      expect(result1.estimatedMaxTotal).toBe(result2.estimatedMaxTotal);
    });
  });
});
