import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './services/orders.service';
import { PaymentMethodsService } from './services/payment-methods.service';
import { OrderMappingService } from './services/order-mapping.service';
import { OrdersRepository } from './repositories/orders.repository';
import { ServicesRepository } from '../services/repositories/services.repository';
import { VendorsRepository } from '../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../vendors/repositories/vendor-service.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { OrderStatus } from './schemas/order.schema';
import { Types } from 'mongoose';
import { AppRequestContext } from '../../common/context/app-request-context';

describe('Update Order - ObjectId Comparison Fix', () => {
  let ordersService: OrdersService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockOrdersRepository = {
    findById: jest.fn(),
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

  const mockOrderMappingService = {
    toResponse: jest.fn((order) => order),
  };

  const mockPaymentMethodsService = {
    getPaymentMethods: jest.fn(),
  };

  const serviceId = new Types.ObjectId('507f1f77bcf86cd799439020');
  const vendorId = new Types.ObjectId('507f1f77bcf86cd799439021');
  const orderId = new Types.ObjectId('507f1f77bcf86cd799439022');

  beforeEach(async () => {
    // Set up request context
    AppRequestContext.setContext({
      requestId: 'test-request-id',
      userId: 'user123',
      userEmail: 'test@example.com',
      userRole: 'user',
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      timestamp: new Date(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: mockOrdersRepository },
        { provide: ServicesRepository, useValue: mockServicesRepository },
        { provide: VendorsRepository, useValue: mockVendorsRepository },
        { provide: VendorServiceRepository, useValue: mockVendorServiceRepository },
        { provide: OrderMappingService, useValue: mockOrderMappingService },
        { provide: PaymentMethodsService, useValue: mockPaymentMethodsService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: 'REQUEST_CONTEXT', useValue: { userId: 'user123' } },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    
    // Mock calculateOrder to avoid complex dependencies
    jest.spyOn(ordersService, 'calculateOrder').mockResolvedValue({
      totalWeight: 10,
      totalItems: 2,
      subtotal: 50,
      deliveryFee: 5,
      promoDiscount: 0,
      estimatedMinTotal: 44,
      estimatedMaxTotal: 66,
      currency: 'GHS',
      needsAdditionalAmount: 0,
      minimumOrderMet: false,
    } as any);
    
    jest.clearAllMocks();
  });

  describe('updateOrder with ObjectId serviceId', () => {
    it('should successfully update order when vendor offers service (ObjectId comparison)', async () => {
      const mockOrder = {
        _id: orderId,
        serviceId: {
          toString: () => serviceId.toString(),
        },
        vendorId: new Types.ObjectId('507f1f77bcf86cd799439099'),
        status: OrderStatus.PENDING,
        items: [{ itemId: 'item1', quantity: 2, unitPrice: 10, total: 20 }],
        pickupAddress: {},
        deliveryAddress: {},
        save: jest.fn().mockResolvedValue({
          _id: orderId,
          serviceId: serviceId,
          vendorId: vendorId,
        }),
      };

      const mockVendor = {
        _id: vendorId,
        name: 'Test Vendor',
      };

      const mockVendorServices = [
        {
          serviceId: {
            toString: () => serviceId.toString(),
          },
          isAvailable: true,
        },
      ];

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue(mockVendorServices);
      mockServicesRepository.findById.mockResolvedValue({ _id: serviceId, basePrice: 25 });
      mockCacheManager.get.mockResolvedValue(null);

      const updateDto = {
        vendorId: vendorId.toString(),
        pickupAddress: { street: '123 Main St', city: 'Accra', region: 'Greater Accra', phone: '0241234567' },
      };

      await expect(ordersService.updateOrder(orderId.toString(), updateDto)).resolves.toBeDefined();
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should throw error when vendor does not offer service', async () => {
      const mockOrder = {
        _id: orderId,
        serviceId: serviceId,
        status: OrderStatus.PENDING,
        items: [],
      };

      const mockVendor = {
        _id: vendorId,
        name: 'Test Vendor',
      };

      const mockVendorServices = [
        {
          serviceId: {
            toString: () => new Types.ObjectId('507f1f77bcf86cd799439099').toString(),
          },
          isAvailable: true,
        },
      ];

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue(mockVendorServices);

      const updateDto = {
        vendorId: vendorId.toString(),
      };

      await expect(ordersService.updateOrder(orderId.toString(), updateDto))
        .rejects.toThrow('Vendor does not offer this service or service is unavailable');
    });
  });

  describe('updateOrderVendor with ObjectId serviceId', () => {
    it('should successfully update vendor when vendor offers service (ObjectId comparison)', async () => {
      const mockOrder = {
        _id: orderId,
        serviceId: {
          toString: () => serviceId.toString(),
        },
        status: OrderStatus.PENDING,
        items: [{ itemId: 'item1', quantity: 2, unitPrice: 10, total: 20 }],
        save: jest.fn().mockResolvedValue({
          _id: orderId,
          serviceId: serviceId,
          vendorId: vendorId,
        }),
      };

      const mockVendor = {
        _id: vendorId,
        name: 'Test Vendor',
      };

      const mockVendorServices = [
        {
          serviceId: {
            toString: () => serviceId.toString(),
          },
          isAvailable: true,
        },
      ];

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue(mockVendorServices);
      mockServicesRepository.findById.mockResolvedValue({ _id: serviceId, basePrice: 25 });
      mockCacheManager.get.mockResolvedValue(null);

      await expect(ordersService.updateOrderVendor(orderId.toString(), vendorId.toString()))
        .resolves.toBeDefined();
      expect(mockOrder.save).toHaveBeenCalled();
    });

    it('should throw error when vendor does not offer service', async () => {
      const mockOrder = {
        _id: orderId,
        serviceId: serviceId,
        status: OrderStatus.PENDING,
      };

      const mockVendor = {
        _id: vendorId,
        name: 'Test Vendor',
      };

      const mockVendorServices = [
        {
          serviceId: {
            toString: () => new Types.ObjectId('507f1f77bcf86cd799439099').toString(),
          },
          isAvailable: true,
        },
      ];

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue(mockVendorServices);

      await expect(ordersService.updateOrderVendor(orderId.toString(), vendorId.toString()))
        .rejects.toThrow('Vendor does not offer this service or service is unavailable');
    });
  });
});
