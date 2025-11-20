import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './services/orders.service';
import { ServicesRepository } from '../services/repositories/services.repository';
import { VendorsRepository } from '../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../vendors/repositories/vendor-service.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Order Confirmation Flow', () => {
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
    
    // Mock context
    Object.defineProperty(ordersService, 'context', {
      get: () => ({ userId: 'test-user-id' }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Order Confirmation Process', () => {
    it('should confirm order with vendor and lock pricing', async () => {
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

      // Mock order with vendor selected
      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'draft',
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 2,
            weight: 0.5,
            unitPrice: 25,
            total: 25,
          }
        ],
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const confirmDto = {
        confirmPricing: true,
        customerNotes: 'Please handle with care',
      };

      const result = await ordersService.confirmOrder('order123', confirmDto);

      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toBeDefined();
      expect(result.lockedPricing).toBeDefined();
      expect(result.lockedPricing.vendorName).toBe('Quick Wash');
      expect(result.lockedPricing.servicePrice).toBe(20);
      expect(result.lockedPricing.deliveryFee).toBe(8);
      expect(result.customerNotes).toBe('Please handle with care');
      expect(result.message).toContain('Order confirmed successfully');
      expect(result.nextSteps).toHaveLength(3);
    });

    it('should prevent confirmation without vendor selection', async () => {
      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'draft',
        vendorId: null, // No vendor selected
        serviceId: '507f1f77bcf86cd799439020',
        items: [],
      } as any);

      const confirmDto = {
        confirmPricing: true,
      };

      await expect(ordersService.confirmOrder('order123', confirmDto))
        .rejects.toThrow('Please select a vendor before confirming order');
    });

    it('should prevent double confirmation', async () => {
      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'confirmed', // Already confirmed
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        items: [],
      } as any);

      const confirmDto = {
        confirmPricing: true,
      };

      await expect(ordersService.confirmOrder('order123', confirmDto))
        .rejects.toThrow('Order is already confirmed');
    });

    it('should prevent updates to confirmed orders', async () => {
      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'confirmed',
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        items: [],
      } as any);

      const updateDto = {
        vendorId: '507f1f77bcf86cd799439012',
      };

      await expect(ordersService.updateOrder('order123', updateDto))
        .rejects.toThrow('Cannot update confirmed order. Contact support for changes.');
    });

    it('should allow updates to draft orders', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      const mockVendor = {
        _id: '507f1f77bcf86cd799439012',
        name: 'Premium Wash',
        deliveryFee: 10,
      };

      const mockVendorService = {
        vendorId: '507f1f77bcf86cd799439012',
        serviceId: '507f1f77bcf86cd799439020',
        price: 30,
        isAvailable: true,
      };

      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'draft', // Still draft
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 1,
            weight: 0.5,
            unitPrice: 25,
            total: 25,
          }
        ],
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const updateDto = {
        vendorId: '507f1f77bcf86cd799439012',
      };

      const result = await ordersService.updateOrder('order123', updateDto);

      expect(result.vendorId).toBe('507f1f77bcf86cd799439012');
      expect(result.deliveryFee).toBe(10); // Updated to new vendor's fee
    });
  });

  describe('Order Status Flow', () => {
    it('should create orders in draft status', async () => {
      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const createDto = {
        serviceId: '507f1f77bcf86cd799439020',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 1,
            weight: 0.5,
          }
        ],
        pickupAddress: {
          street: '123 Test St',
          city: 'Accra',
          region: 'Greater Accra',
          phone: '+233123456789',
        },
        deliveryAddress: {
          street: '456 Delivery St',
          city: 'Accra',
          region: 'Greater Accra',
          phone: '+233987654321',
        },
      };

      const result = await ordersService.createOrder(createDto);

      expect(result.status).toBe('draft');
      expect(result.orderNumber).toBeDefined();
      expect(result.total).toBeDefined();
    });
  });

  describe('Order Confirmation Details', () => {
    it('should get order confirmation details with current pricing', async () => {
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

      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'draft',
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        items: [
          {
            itemId: 'shirt001',
            name: 'Cotton Shirt',
            category: 'Shirts',
            categoryId: 'cat001',
            quantity: 2,
            weight: 0.5,
            unitPrice: 25,
            total: 25,
          }
        ],
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await ordersService.getOrderConfirmationDetails('order123');

      expect(result.order).toBeDefined();
      expect(result.vendor).toBeDefined();
      expect(result.service).toBeDefined();
      expect(result.pricingBreakdown).toBeDefined();
      expect(result.canConfirm).toBe(true); // Draft with vendor
      expect(result.confirmationRequired).toBe(true);
      expect(result.isLocked).toBe(false);

      // Verify pricing details
      expect(result.order.subtotal).toBeDefined();
      expect(result.order.deliveryFee).toBe(8); // Vendor's delivery fee
      expect(result.pricingBreakdown.vendor.name).toBe('Quick Wash');
      expect(result.pricingBreakdown.itemBreakdown).toHaveLength(1);
    });

    it('should indicate cannot confirm without vendor', async () => {
      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'draft',
        vendorId: null, // No vendor selected
        serviceId: '507f1f77bcf86cd799439020',
        items: [],
      } as any);

      const mockService = {
        _id: '507f1f77bcf86cd799439020',
        name: 'Laundry Service',
        basePrice: 25,
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await ordersService.getOrderConfirmationDetails('order123');

      expect(result.canConfirm).toBe(false); // No vendor selected
      expect(result.vendor).toBeNull();
      expect(result.pricingBreakdown).toBeNull();
    });

    it('should show locked status for confirmed orders', async () => {
      jest.spyOn(ordersService, 'getOrderById').mockResolvedValue({
        id: 'order123',
        status: 'confirmed', // Already confirmed
        vendorId: '507f1f77bcf86cd799439011',
        serviceId: '507f1f77bcf86cd799439020',
        items: [],
        lockedPricing: {
          vendorName: 'Quick Wash',
          total: 48.00,
        },
      } as any);

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

      const result = await ordersService.getOrderConfirmationDetails('order123');

      expect(result.canConfirm).toBe(false); // Already confirmed
      expect(result.confirmationRequired).toBe(false);
      expect(result.isLocked).toBe(true);
    });
  });
});
