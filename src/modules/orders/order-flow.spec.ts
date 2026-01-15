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
import { DeliveryType, PaymentMethod } from './dto/checkout.dto';

describe('Complete Order Flow Integration Test', () => {
  let ordersService: OrdersService;
  let paymentMethodsService: PaymentMethodsService;
  let orderMappingService: OrderMappingService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockOrdersRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
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

  // Mock data
  const mockService = {
    _id: '507f1f77bcf86cd799439020',
    name: 'Laundry Service',
    basePrice: 25,
    description: 'Professional laundry service',
  };

  const mockVendor = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Quick Wash',
    deliveryFee: 8,
    rating: 4.6,
    estimatedPickupTime: 30,
  };

  const mockVendorService = {
    vendorId: '507f1f77bcf86cd799439011',
    serviceId: '507f1f77bcf86cd799439020',
    price: 20,
    isAvailable: true,
    turnaroundHours: 24,
  };

  const orderItems = [
    {
      itemId: 'shirt001',
      name: 'Cotton Shirt',
      category: 'Shirts',
      categoryId: 'cat001',
      quantity: 2,
      weight: 0.5,
    },
    {
      itemId: 'pants001',
      name: 'Jeans',
      category: 'Pants',
      categoryId: 'cat002',
      quantity: 1,
      weight: 0.8,
    },
  ];

  const mockOrder = {
    _id: '507f1f77bcf86cd799439099',
    orderNumber: 'YRS123456',
    status: OrderStatus.DRAFT,
    userId: 'user123',
    serviceId: '507f1f77bcf86cd799439020',
    vendorId: '507f1f77bcf86cd799439011',
    items: orderItems.map(item => ({
      ...item,
      unitPrice: 20,
      total: item.weight * 20 * item.quantity,
    })),
    pickupAddress: {
      street: '123 Main St',
      city: 'Accra',
      region: 'Greater Accra',
      phone: '+233555000001',
    },
    deliveryAddress: {
      street: '456 Oak Ave',
      city: 'Accra',
      region: 'Greater Accra',
      phone: '+233555000001',
    },
    totalWeight: 1.8,
    totalItems: 3,
    subtotal: 36,
    deliveryFee: 8,
    promoDiscount: 0,
    estimatedMinTotal: 36.8,
    estimatedMaxTotal: 51.2,
    total: 44,
    currency: 'GHS',
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue(this),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        PaymentMethodsService,
        OrderMappingService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: OrdersRepository,
          useValue: mockOrdersRepository,
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
    paymentMethodsService = module.get<PaymentMethodsService>(PaymentMethodsService);
    orderMappingService = module.get<OrderMappingService>(OrderMappingService);

    // Mock context
    Object.defineProperty(ordersService, 'context', {
      get: () => ({ userId: 'user123' }),
    });
    Object.defineProperty(paymentMethodsService, 'context', {
      get: () => ({ userId: 'user123' }),
    });

    // Setup default mocks
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
    mockCacheManager.del.mockResolvedValue(undefined);
    mockServicesRepository.findById.mockResolvedValue(mockService);
    mockVendorsRepository.findById.mockResolvedValue(mockVendor);
    mockVendorServiceRepository.findByVendorId.mockResolvedValue([mockVendorService]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('🔄 Complete Order Flow', () => {
    it('should complete full order flow: calculate → create → confirm → checkout', async () => {
      console.log('\n🚀 Starting Complete Order Flow Test\n');

      // Step 1: Calculate pricing with vendor
      console.log('📊 Step 1: Calculate pricing with vendor');
      const calculation = await ordersService.calculateOrder({
        serviceId: mockService._id,
        vendorId: mockVendor._id.toString(),
        items: orderItems,
      });

      expect(calculation.subtotal).toBe(36);
      expect(calculation.deliveryFee).toBe(8);
      expect(calculation.totalWeight).toBe(1.8);
      expect(calculation.totalItems).toBe(3);
      expect(calculation.estimatedMinTotal).toBe(37); // (36 * 0.8) + 8
      expect(calculation.estimatedMaxTotal).toBe(51); // (36 * 1.2) + 8
      expect(calculation.vendorPricing).toBeDefined();
      expect(calculation.vendorPricing.vendor.name).toBe('Quick Wash');
      console.log('✅ Pricing calculated successfully');

      // Step 2: Create draft order
      console.log('\n📝 Step 2: Create draft order');
      mockOrdersRepository.create.mockResolvedValue(mockOrder);

      const createdOrder = await ordersService.createOrder({
        serviceId: mockService._id,
        vendorId: mockVendor._id.toString(),
        items: orderItems,
        pickupAddress: mockOrder.pickupAddress,
        deliveryAddress: mockOrder.deliveryAddress,
      });

      expect(mockOrdersRepository.create).toHaveBeenCalled();
      expect(createdOrder.status).toBe(OrderStatus.DRAFT);
      expect(createdOrder.vendorId).toBe(mockVendor._id.toString());
      console.log('✅ Order created with ID:', createdOrder.id);

      // Step 3: Get order confirmation details
      console.log('\n👁️ Step 3: Get order confirmation details');
      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const confirmationDetails = await ordersService.getOrderConfirmationDetails(mockOrder._id);

      expect(confirmationDetails.order).toBeDefined();
      expect(confirmationDetails.vendor).toBeDefined();
      expect(confirmationDetails.service).toBeDefined();
      expect(confirmationDetails.canConfirm).toBe(true);
      expect(confirmationDetails.isLocked).toBe(false);
      console.log('✅ Confirmation details retrieved');

      // Step 4: Confirm order (locks pricing)
      console.log('\n✅ Step 4: Confirm order');
      const draftOrderForConfirm = {
        ...mockOrder,
        status: OrderStatus.DRAFT, // Must be DRAFT to confirm
        save: jest.fn().mockImplementation(function() {
          this.status = OrderStatus.CONFIRMED;
          this.confirmedAt = new Date();
          this.lockedPricing = {
            vendorId: mockVendor._id.toString(),
            vendorName: mockVendor.name,
            servicePrice: mockVendorService.price,
            deliveryFee: mockVendor.deliveryFee,
            subtotal: 36,
            total: 44,
            confirmedAt: new Date(),
          };
          return Promise.resolve(this);
        }),
      };
      mockOrdersRepository.findById.mockResolvedValue(draftOrderForConfirm);

      const confirmedOrder = await ordersService.confirmOrder(mockOrder._id, {
        confirmPricing: true,
        customerNotes: 'Please handle with care',
      });

      expect(confirmedOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(confirmedOrder.lockedPricing).toBeDefined();
      expect(confirmedOrder.lockedPricing.vendorName).toBe('Quick Wash');
      expect(confirmedOrder.message).toContain('confirmed successfully');
      console.log('✅ Order confirmed and pricing locked');

      // Step 5: Get checkout details
      console.log('\n💳 Step 5: Get checkout details');
      // Update mock to return confirmed order
      const confirmedOrderForCheckout = {
        ...draftOrderForConfirm,
        status: OrderStatus.CONFIRMED,
        confirmedAt: new Date(),
        lockedPricing: {
          vendorId: mockVendor._id.toString(),
          vendorName: mockVendor.name,
          servicePrice: mockVendorService.price,
          deliveryFee: mockVendor.deliveryFee,
          subtotal: 36,
          total: 44,
          confirmedAt: new Date(),
        },
      };
      mockOrdersRepository.findById.mockResolvedValue(confirmedOrderForCheckout);
      
      const checkoutDetails = await ordersService.getCheckoutDetails(mockOrder._id);

      expect(checkoutDetails.deliveryOptions).toHaveLength(2);
      expect(checkoutDetails.deliveryOptions[0].type).toBe(DeliveryType.SELF_SERVICE);
      expect(checkoutDetails.deliveryOptions[1].type).toBe(DeliveryType.DELIVERY_SERVICE);
      expect(checkoutDetails.paymentMethods).toBeDefined();
      console.log('✅ Checkout details retrieved');

      // Step 6: Process checkout
      console.log('\n🛒 Step 6: Process checkout');
      const checkoutOrderMock = {
        ...confirmedOrderForCheckout,
        _id: mockOrder._id,
        deliveryType: DeliveryType.DELIVERY_SERVICE,
        paymentMethod: PaymentMethod.MTN_MOBILE_MONEY,
        paymentReference: 'PAY_123456',
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(this);
        }),
      };
      mockOrdersRepository.findById.mockResolvedValue(checkoutOrderMock);

      const checkoutResult = await ordersService.processCheckout({
        orderId: mockOrder._id,
        checkoutOptions: {
          deliveryType: DeliveryType.DELIVERY_SERVICE,
          paymentMethod: PaymentMethod.MTN_MOBILE_MONEY,
        },
      });

      expect(checkoutResult.orderId).toBeDefined();
      expect(checkoutResult.status).toBe(OrderStatus.CONFIRMED);
      expect(checkoutResult.paymentMethod).toBe(PaymentMethod.MTN_MOBILE_MONEY);
      expect(checkoutResult.deliveryType).toBe(DeliveryType.DELIVERY_SERVICE);
      expect(checkoutResult.paymentUrl).toBeDefined();
      expect(checkoutResult.message).toContain('successfully');
      expect(checkoutResult.nextSteps).toBeDefined();
      console.log('✅ Checkout processed successfully');

      console.log('\n🎉 Complete Order Flow Test Passed!\n');
    });

    it('should handle self-service delivery (no delivery fee)', async () => {
      console.log('\n🚶 Testing Self-Service Delivery\n');

      const selfServiceOrder = {
        ...mockOrder,
        _id: mockOrder._id,
        status: OrderStatus.CONFIRMED,
        save: jest.fn().mockImplementation(function() {
          this.deliveryFee = 0;
          this.total = this.subtotal;
          return Promise.resolve(this);
        }),
      };
      
      mockOrdersRepository.create.mockResolvedValue(mockOrder);
      mockOrdersRepository.findById.mockResolvedValue(selfServiceOrder);

      const checkoutResult = await ordersService.processCheckout({
        orderId: mockOrder._id,
        checkoutOptions: {
          deliveryType: DeliveryType.SELF_SERVICE,
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        },
      });

      expect(checkoutResult.deliveryType).toBe(DeliveryType.SELF_SERVICE);
      expect(checkoutResult.totalAmount).toBe(36); // Subtotal only, no delivery fee
      console.log('✅ Self-service delivery handled correctly');
    });

    it('should prevent updates to confirmed orders', async () => {
      console.log('\n🔒 Testing Order Lock After Confirmation\n');

      mockOrdersRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      await expect(
        ordersService.updateOrder(mockOrder._id, {
          vendorId: 'different-vendor-id',
        })
      ).rejects.toThrow('Cannot update confirmed order');

      console.log('✅ Confirmed order update prevented');
    });

    it('should validate vendor offers service', async () => {
      console.log('\n🔍 Testing Vendor Service Validation\n');

      mockVendorServiceRepository.findByVendorId.mockResolvedValue([
        {
          ...mockVendorService,
          isAvailable: false,
        },
      ]);

      await expect(
        ordersService.createOrder({
          serviceId: mockService._id,
          vendorId: mockVendor._id.toString(),
          items: orderItems,
          pickupAddress: mockOrder.pickupAddress,
          deliveryAddress: mockOrder.deliveryAddress,
        })
      ).rejects.toThrow('Vendor does not offer this service');

      console.log('✅ Vendor service validation working');
    });

    it('should calculate correct pricing with weight variation', async () => {
      console.log('\n⚖️ Testing Weight-Based Pricing Calculation\n');

      const calculation = await ordersService.calculateOrder({
        serviceId: mockService._id,
        vendorId: mockVendor._id.toString(),
        items: [
          { itemId: 'item1', name: 'Item 1', category: 'Cat', categoryId: 'cat1', quantity: 1, weight: 2.0 },
        ],
      });

      // 2.0kg * 20 GHS/kg = 40 GHS subtotal
      expect(calculation.subtotal).toBe(40);
      expect(calculation.deliveryFee).toBe(8);
      // Min: (40 * 0.8) + 8 = 40
      expect(calculation.estimatedMinTotal).toBe(40);
      // Max: (40 * 1.2) + 8 = 56
      expect(calculation.estimatedMaxTotal).toBe(56);

      console.log('✅ Weight-based pricing calculated correctly');
    });

    it('should retrieve user orders from database', async () => {
      console.log('\n📋 Testing Get User Orders\n');

      mockOrdersRepository.findByUserId.mockResolvedValue([mockOrder]);

      const orders = await ordersService.getUserOrders();

      expect(mockOrdersRepository.findByUserId).toHaveBeenCalledWith('user123');
      expect(orders).toHaveLength(1);
      expect(orders[0].orderNumber).toBe('YRS123456');

      console.log('✅ User orders retrieved from database');
    });

    it('should fetch payment methods from service', async () => {
      console.log('\n💳 Testing Payment Methods Integration\n');

      const mockPaymentMethods = [
        {
          id: 'pm_1',
          type: 'mobile_money',
          displayName: 'MTN Mobile Money',
          maskedDetails: '+233**5***06',
          isDefault: true,
          isVerified: true,
          createdAt: new Date(),
        },
      ];

      mockCacheManager.get.mockResolvedValueOnce(mockPaymentMethods);
      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const checkoutDetails = await ordersService.getCheckoutDetails(mockOrder._id);

      expect(checkoutDetails.paymentMethods).toHaveLength(1);
      expect(checkoutDetails.paymentMethods[0].displayName).toBe('MTN Mobile Money');

      console.log('✅ Payment methods fetched from service');
    });
  });

  describe('🧮 Order Mapping Service', () => {
    it('should map order to response format', () => {
      const response = orderMappingService.toResponse(mockOrder as any);

      expect(response.id).toBe(mockOrder._id);
      expect(response.orderNumber).toBe(mockOrder.orderNumber);
      expect(response.status).toBe(mockOrder.status);
      expect(response.subtotal).toBe(mockOrder.subtotal);
      expect(response.total).toBe(mockOrder.total);
    });

    it('should map order list to response format', () => {
      const orders = [mockOrder, mockOrder];
      const response = orderMappingService.toResponseList(orders as any);

      expect(response).toHaveLength(2);
      expect(response[0].orderNumber).toBe('YRS123456');
    });

    it('should map order with vendor and service details', () => {
      const response = orderMappingService.toDetailedResponse(
        mockOrder as any,
        mockVendor,
        mockService
      );

      expect(response.vendor).toBeDefined();
      expect(response.vendor.name).toBe('Quick Wash');
      expect(response.service).toBeDefined();
      expect(response.service.name).toBe('Laundry Service');
    });
  });
});
