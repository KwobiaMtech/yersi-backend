import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './services/orders.service';
import { ServicesRepository } from '../services/repositories/services.repository';
import { VendorsRepository } from '../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../vendors/repositories/vendor-service.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DeliveryType, PaymentMethod } from './dto/checkout.dto';

describe('Checkout Flow', () => {
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

  describe('Checkout Details', () => {
    it('should get checkout details with delivery and payment options', async () => {
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
            quantity: 1,
            weight: 0.5,
            unitPrice: 25,
            total: 25,
          }
        ],
        deliveryAddress: {
          formattedAddress: 'East Legon, Greater Accra, Ghana'
        }
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await ordersService.getCheckoutDetails('order123');

      expect(result.deliveryOptions).toHaveLength(2);
      expect(result.deliveryOptions[0].type).toBe(DeliveryType.SELF_SERVICE);
      expect(result.deliveryOptions[1].type).toBe(DeliveryType.DELIVERY_SERVICE);
      expect(result.paymentMethods).toHaveLength(2);
      expect(result.canAddPaymentMethod).toBe(true);
    });
  });

  describe('Checkout Processing', () => {
    it('should process checkout with delivery service and mobile money', async () => {
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
            quantity: 1,
            weight: 0.5,
            unitPrice: 25,
            total: 25,
          }
        ],
        subtotal: 10,
        deliveryFee: 8,
        total: 18,
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const checkoutDto = {
        orderId: 'order123',
        checkoutOptions: {
          deliveryType: DeliveryType.DELIVERY_SERVICE,
          paymentMethod: PaymentMethod.MTN_MOBILE_MONEY,
          paymentDetails: '+233555000006',
        },
        customerNotes: 'Please handle with care',
      };

      const result = await ordersService.processCheckout(checkoutDto);

      expect(result.orderId).toBe('order123');
      expect(result.deliveryType).toBe(DeliveryType.DELIVERY_SERVICE);
      expect(result.paymentMethod).toBe(PaymentMethod.MTN_MOBILE_MONEY);
      expect(result.paymentUrl).toBeDefined();
      expect(result.paymentReference).toContain('PAY_');
      expect(result.message).toContain('with delivery service');
      expect(result.nextSteps).toContain('Complete payment using the provided link');
    });

    it('should process checkout with self service and cash on delivery', async () => {
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
        items: [],
        subtotal: 10,
        deliveryFee: 8,
        total: 18,
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const checkoutDto = {
        orderId: 'order123',
        checkoutOptions: {
          deliveryType: DeliveryType.SELF_SERVICE,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        },
      };

      const result = await ordersService.processCheckout(checkoutDto);

      expect(result.deliveryType).toBe(DeliveryType.SELF_SERVICE);
      expect(result.paymentMethod).toBe(PaymentMethod.CASH_ON_DELIVERY);
      expect(result.totalAmount).toBe(10); // No delivery fee for self service
      expect(result.paymentUrl).toBeUndefined();
      expect(result.message).toContain('for self-service pickup');
      expect(result.nextSteps).toContain('Visit the vendor location for drop-off and pickup');
    });

    it('should handle card payment processing', async () => {
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
        items: [],
        subtotal: 10,
        total: 18,
      } as any);

      mockCacheManager.get.mockResolvedValue(null);
      mockServicesRepository.findById.mockResolvedValue(mockService);
      mockVendorsRepository.findById.mockResolvedValue(mockVendor);
      mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);

      const checkoutDto = {
        orderId: 'order123',
        checkoutOptions: {
          deliveryType: DeliveryType.DELIVERY_SERVICE,
          paymentMethod: PaymentMethod.VISA_CARD,
          paymentDetails: 'card_token_123',
        },
      };

      const result = await ordersService.processCheckout(checkoutDto);

      expect(result.paymentMethod).toBe(PaymentMethod.VISA_CARD);
      expect(result.paymentReference).toContain('CARD_');
      expect(result.paymentUrl).toContain('card-processor.com');
    });
  });
});
