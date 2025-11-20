import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppRequestContext } from '../../../common/context/app-request-context';
import { CalculateOrderDto, OrderCalculationResponseDto, CreateOrderDto, UpdateOrderDto, ConfirmOrderDto } from '../dto/order.dto';
import { CheckoutOptionsDto, CheckoutSummaryDto, DeliveryType, PaymentMethod } from '../dto/checkout.dto';
import { ServicesRepository } from '../../services/repositories/services.repository';
import { VendorsRepository } from '../../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../../vendors/repositories/vendor-service.repository';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private servicesRepository: ServicesRepository,
    private vendorsRepository: VendorsRepository,
    private vendorServiceRepository: VendorServiceRepository,
  ) {}

  private get context() {
    return AppRequestContext.context;
  }

  async calculateOrder(calculateDto: CalculateOrderDto): Promise<OrderCalculationResponseDto> {
    const cacheKey = `order-calc-${JSON.stringify(calculateDto)}`;
    
    const cached = await this.cacheManager.get<OrderCalculationResponseDto>(cacheKey);
    if (cached) return cached;

    // Validate service exists
    const service = await this.servicesRepository.findById(calculateDto.serviceId);
    if (!service) {
      throw new NotFoundException(`Service with ID ${calculateDto.serviceId} not found`);
    }

    let deliveryFee = 5; // Default delivery fee
    let servicePrice = service.basePrice; // Default service price
    let vendor = null;
    let vendorService = null;

    // If vendor is specified, get vendor-specific pricing
    if (calculateDto.vendorId) {
      vendor = await this.vendorsRepository.findById(calculateDto.vendorId);
      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${calculateDto.vendorId} not found`);
      }

      // Check if vendor offers this service
      const vendorServices = await this.vendorServiceRepository.findByVendorId(calculateDto.vendorId);
      vendorService = vendorServices.find(vs => vs.serviceId.toString() === calculateDto.serviceId);
      
      if (!vendorService || !vendorService.isAvailable) {
        throw new BadRequestException(`Vendor does not offer this service or service is unavailable`);
      }

      deliveryFee = vendor.deliveryFee;
      servicePrice = vendorService.price;
    }

    // Calculate totals and item breakdown
    let totalWeight = 0;
    let totalItems = 0;
    let subtotal = 0;
    let baseSubtotal = 0;
    const itemBreakdown = [];

    calculateDto.items.forEach(item => {
      totalWeight += item.weight * item.quantity;
      totalItems += item.quantity;
      
      const vendorItemTotal = (item.weight * servicePrice) * item.quantity;
      const baseItemTotal = (item.weight * service.basePrice) * item.quantity;
      
      subtotal += vendorItemTotal;
      baseSubtotal += baseItemTotal;

      // Add to breakdown if vendor is selected
      if (vendor) {
        itemBreakdown.push({
          itemId: item.itemId,
          name: item.name,
          basePrice: service.basePrice,
          vendorPrice: servicePrice,
          quantity: item.quantity,
          weight: item.weight,
          itemTotal: vendorItemTotal,
          savings: baseItemTotal - vendorItemTotal,
        });
      }
    });

    const promoDiscount = calculateDto.promoCode ? 5 : 0;
    
    // Estimated range (±20% variation)
    const estimatedMinTotal = Math.round((subtotal + deliveryFee - promoDiscount) * 0.8);
    const estimatedMaxTotal = Math.round((subtotal + deliveryFee - promoDiscount) * 1.2);
    
    const minimumOrderAmount = 100;
    const currentTotal = subtotal + deliveryFee - promoDiscount;
    const minimumOrderMet = currentTotal >= minimumOrderAmount;
    const needsAdditionalAmount = minimumOrderMet ? 0 : minimumOrderAmount - currentTotal;

    const calculation: OrderCalculationResponseDto = {
      totalWeight,
      totalItems,
      subtotal,
      deliveryFee,
      promoDiscount,
      estimatedMinTotal,
      estimatedMaxTotal,
      currency: 'GHS',
      needsAdditionalAmount,
      minimumOrderMet,
    };

    // Add vendor pricing details if vendor is selected
    if (vendor && vendorService) {
      calculation.vendorPricing = {
        vendor: {
          id: vendor._id.toString(),
          name: vendor.name,
          deliveryFee: vendor.deliveryFee,
        },
        itemBreakdown,
        comparedToBase: (baseSubtotal + 5) - (subtotal + deliveryFee), // Compare with base delivery fee
      };
    }
    
    await this.cacheManager.set(cacheKey, calculation, 300);
    return calculation;
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    // Validate serviceId exists
    const service = await this.servicesRepository.findById(createOrderDto.serviceId);
    if (!service) {
      throw new NotFoundException(`Service with ID ${createOrderDto.serviceId} not found`);
    }

    // Validate vendor if provided
    if (createOrderDto.vendorId) {
      const vendor = await this.vendorsRepository.findById(createOrderDto.vendorId);
      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${createOrderDto.vendorId} not found`);
      }

      // Check if vendor offers this service
      const vendorServices = await this.vendorServiceRepository.findByVendorId(createOrderDto.vendorId);
      const vendorService = vendorServices.find(vs => vs.serviceId.toString() === createOrderDto.serviceId);
      
      if (!vendorService || !vendorService.isAvailable) {
        throw new BadRequestException(`Vendor does not offer this service or service is unavailable`);
      }
    }

    // Calculate order totals
    const calculation = await this.calculateOrder({
      serviceId: createOrderDto.serviceId,
      vendorId: createOrderDto.vendorId,
      items: createOrderDto.items,
    });

    // Create order with vendor assignment
    const order = {
      id: `ORD-${Date.now()}`,
      orderNumber: `YRS${Date.now().toString().slice(-6)}`,
      status: 'draft', // Start as draft until confirmed
      userId: this.context.userId,
      ...createOrderDto,
      ...calculation,
      total: calculation.estimatedMaxTotal,
      createdAt: new Date(),
    };
    
    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return order;
  }

  async getUserOrders() {
    const cacheKey = `user-orders-${this.context.userId}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Mock orders with weight-based data
    const orders = [
      {
        id: '123',
        orderNumber: 'YRS123456',
        status: 'pending',
        totalWeight: 4,
        totalItems: 4,
        estimatedMinTotal: 95,
        estimatedMaxTotal: 120,
        currency: 'GHS',
      }
    ];
    
    await this.cacheManager.set(cacheKey, orders, 120);
    return orders;
  }

  async getOrderById(orderId: string) {
    return {
      id: orderId,
      orderNumber: `YRS${orderId}`,
      status: 'draft', // Default to draft status
      serviceId: '507f1f77bcf86cd799439020', // Mock service ID
      vendorId: null,
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
      totalWeight: 4,
      totalItems: 4,
      estimatedMinTotal: 95,
      estimatedMaxTotal: 120,
      currency: 'GHS',
    };
  }

  async getOrderWithDetails(orderId: string) {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get vendor details if order has vendor
    let vendorDetails = null;
    if (order.vendorId) {
      vendorDetails = await this.vendorsRepository.findById(order.vendorId);
    }

    // Get service details
    let serviceDetails = null;
    if (order.serviceId) {
      serviceDetails = await this.servicesRepository.findById(order.serviceId);
    }

    return {
      ...order,
      vendor: vendorDetails,
      service: serviceDetails,
    };
  }

  async getOrderConfirmationDetails(orderId: string) {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get current pricing with vendor if selected
    let currentPricing = null;
    if (order.vendorId) {
      currentPricing = await this.calculateOrder({
        serviceId: order.serviceId,
        vendorId: order.vendorId,
        items: order.items,
      });
    } else {
      // Base pricing without vendor
      currentPricing = await this.calculateOrder({
        serviceId: order.serviceId,
        items: order.items,
      });
    }

    // Get vendor details
    let vendorDetails = null;
    if (order.vendorId) {
      vendorDetails = await this.vendorsRepository.findById(order.vendorId);
    }

    // Get service details
    const serviceDetails = await this.servicesRepository.findById(order.serviceId);

    return {
      order: {
        ...order,
        ...currentPricing, // Include current pricing
      },
      vendor: vendorDetails,
      service: serviceDetails,
      pricingBreakdown: currentPricing.vendorPricing || null,
      canConfirm: order.status === 'draft' && !!order.vendorId,
      confirmationRequired: order.status === 'draft',
      isLocked: order.status === 'confirmed',
    };
  }

  async updateOrderVendor(orderId: string, vendorId: string) {
    // Validate vendor exists
    const vendor = await this.vendorsRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Get existing order (mock implementation)
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Validate vendor offers the service
    const vendorServices = await this.vendorServiceRepository.findByVendorId(vendorId);
    const vendorService = vendorServices.find(vs => vs.serviceId.toString() === order.serviceId);
    
    if (!vendorService || !vendorService.isAvailable) {
      throw new BadRequestException(`Vendor does not offer this service or service is unavailable`);
    }

    // Update order with new vendor
    const updatedOrder = {
      ...order,
      vendorId,
      updatedAt: new Date(),
    };

    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return updatedOrder;
  }

  async updateOrder(orderId: string, updateDto: UpdateOrderDto) {
    // Get existing order
    const existingOrder = await this.getOrderById(orderId);
    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Prevent updates to confirmed orders
    if (existingOrder.status === 'confirmed') {
      throw new BadRequestException('Cannot update confirmed order. Contact support for changes.');
    }

    // Validate service if being updated
    if (updateDto.serviceId) {
      const service = await this.servicesRepository.findById(updateDto.serviceId);
      if (!service) {
        throw new NotFoundException(`Service with ID ${updateDto.serviceId} not found`);
      }
    }

    // Validate vendor if being updated
    if (updateDto.vendorId) {
      const vendor = await this.vendorsRepository.findById(updateDto.vendorId);
      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${updateDto.vendorId} not found`);
      }

      // Check if vendor offers the service
      const serviceId = updateDto.serviceId || existingOrder.serviceId;
      const vendorServices = await this.vendorServiceRepository.findByVendorId(updateDto.vendorId);
      const vendorService = vendorServices.find(vs => vs.serviceId.toString() === serviceId);
      
      if (!vendorService || !vendorService.isAvailable) {
        throw new BadRequestException(`Vendor does not offer this service or service is unavailable`);
      }
    }

    // Recalculate totals if items or vendor changed
    let calculation = null;
    if (updateDto.items || updateDto.vendorId || updateDto.serviceId) {
      calculation = await this.calculateOrder({
        serviceId: updateDto.serviceId || existingOrder.serviceId,
        vendorId: updateDto.vendorId || existingOrder.vendorId,
        items: updateDto.items || existingOrder.items,
      });
    }

    // Update order
    const updatedOrder = {
      ...existingOrder,
      ...updateDto,
      ...(calculation && calculation),
      updatedAt: new Date(),
    };

    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return updatedOrder;
  }

  async confirmOrder(orderId: string, confirmDto: ConfirmOrderDto) {
    // Get existing order
    const existingOrder = await this.getOrderById(orderId);
    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if already confirmed
    if (existingOrder.status === 'confirmed') {
      throw new BadRequestException('Order is already confirmed');
    }

    // Validate vendor is selected
    if (!existingOrder.vendorId) {
      throw new BadRequestException('Please select a vendor before confirming order');
    }

    // Get final pricing calculation
    const finalPricing = await this.calculateOrder({
      serviceId: existingOrder.serviceId,
      vendorId: existingOrder.vendorId,
      items: existingOrder.items,
    });

    // Get vendor details for locked pricing
    const vendor = await this.vendorsRepository.findById(existingOrder.vendorId);
    const vendorServices = await this.vendorServiceRepository.findByVendorId(existingOrder.vendorId);
    const vendorService = vendorServices.find(vs => vs.serviceId.toString() === existingOrder.serviceId);

    // Lock in pricing at confirmation
    const confirmedOrder = {
      ...existingOrder,
      status: 'confirmed',
      confirmedAt: new Date(),
      customerNotes: confirmDto.customerNotes,
      lockedPricing: {
        vendorId: vendor._id.toString(),
        vendorName: vendor.name,
        servicePrice: vendorService.price,
        deliveryFee: vendor.deliveryFee,
        subtotal: finalPricing.subtotal,
        total: finalPricing.estimatedMaxTotal,
        confirmedAt: new Date(),
      },
      // Lock final totals
      subtotal: finalPricing.subtotal,
      deliveryFee: finalPricing.deliveryFee,
      total: finalPricing.estimatedMaxTotal,
    };

    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return {
      ...confirmedOrder,
      message: 'Order confirmed successfully! Your vendor has been notified.',
      nextSteps: [
        'Vendor will contact you for pickup scheduling',
        'Track your order status in the app',
        'You will be notified when items are ready'
      ]
    };
  }

  async getCheckoutDetails(orderId: string) {
    const orderDetails = await this.getOrderConfirmationDetails(orderId);
    
    if (!orderDetails.canConfirm) {
      throw new BadRequestException('Order cannot be checked out. Please complete order details first.');
    }

    // Get user's saved payment methods (mock data)
    const savedPaymentMethods = [
      {
        id: 'mtn_001',
        type: PaymentMethod.MTN_MOBILE_MONEY,
        displayName: 'MTN Mobile Money',
        details: '+23355****06',
        isDefault: true,
      },
      {
        id: 'visa_001',
        type: PaymentMethod.VISA_CARD,
        displayName: 'Visa Card',
        details: '000*******0009884',
        isDefault: false,
      },
    ];

    return {
      ...orderDetails,
      deliveryOptions: [
        {
          type: DeliveryType.SELF_SERVICE,
          name: 'Self Service',
          description: 'Drop off and pick up yourself',
          fee: 0,
          estimatedTime: '2-3 hours',
        },
        {
          type: DeliveryType.DELIVERY_SERVICE,
          name: 'Delivery Service',
          description: orderDetails.order.deliveryAddress?.formattedAddress || 'East Legon, Greater Accra, Ghana',
          fee: orderDetails.order.deliveryFee,
          estimatedTime: '30-45 minutes',
        },
      ],
      paymentMethods: savedPaymentMethods,
      canAddPaymentMethod: true,
    };
  }

  async processCheckout(checkoutDto: CheckoutSummaryDto) {
    // Get order details
    const orderDetails = await this.getOrderConfirmationDetails(checkoutDto.orderId);
    
    if (!orderDetails.canConfirm) {
      throw new BadRequestException('Order cannot be checked out');
    }

    // Adjust pricing based on delivery type
    let finalTotal = orderDetails.order.total;
    if (checkoutDto.checkoutOptions.deliveryType === DeliveryType.SELF_SERVICE) {
      finalTotal = orderDetails.order.subtotal || orderDetails.order.total - orderDetails.order.deliveryFee; // Remove delivery fee
    }

    // First confirm the order
    await this.confirmOrder(checkoutDto.orderId, {
      confirmPricing: true,
      customerNotes: checkoutDto.customerNotes,
    });

    // Process payment based on method
    const paymentResult = await this.processPayment(
      checkoutDto.checkoutOptions.paymentMethod,
      finalTotal,
      checkoutDto.checkoutOptions.paymentDetails
    );

    // Update order with checkout details
    const checkoutOrder = {
      ...orderDetails.order,
      deliveryType: checkoutDto.checkoutOptions.deliveryType,
      paymentMethod: checkoutDto.checkoutOptions.paymentMethod,
      paymentReference: paymentResult.reference,
      finalTotal,
      status: paymentResult.requiresConfirmation ? 'pending_payment' : 'confirmed',
    };

    await this.cacheManager.del(`user-orders-${this.context.userId}`);

    return {
      orderId: checkoutOrder.id,
      orderNumber: checkoutOrder.orderNumber,
      status: checkoutOrder.status,
      totalAmount: finalTotal,
      currency: 'GHS',
      paymentMethod: checkoutDto.checkoutOptions.paymentMethod,
      deliveryType: checkoutDto.checkoutOptions.deliveryType,
      paymentUrl: paymentResult.paymentUrl,
      paymentReference: paymentResult.reference,
      message: this.getCheckoutMessage(checkoutDto.checkoutOptions),
      nextSteps: this.getCheckoutNextSteps(checkoutDto.checkoutOptions),
    };
  }

  private async processPayment(method: PaymentMethod, amount: number, paymentDetails?: string) {
    // Mock payment processing
    switch (method) {
      case PaymentMethod.MTN_MOBILE_MONEY:
      case PaymentMethod.VODAFONE_CASH:
      case PaymentMethod.AIRTELTIGO_MONEY:
        return {
          reference: `PAY_${Date.now()}`,
          paymentUrl: `https://payment-gateway.com/pay/${Date.now()}`,
          requiresConfirmation: true,
        };
      
      case PaymentMethod.VISA_CARD:
      case PaymentMethod.MASTERCARD:
        return {
          reference: `CARD_${Date.now()}`,
          paymentUrl: `https://card-processor.com/pay/${Date.now()}`,
          requiresConfirmation: true,
        };
      
      case PaymentMethod.CASH_ON_DELIVERY:
        return {
          reference: `COD_${Date.now()}`,
          requiresConfirmation: false,
        };
      
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  private getCheckoutMessage(options: CheckoutOptionsDto): string {
    const deliveryMsg = options.deliveryType === DeliveryType.SELF_SERVICE 
      ? 'for self-service pickup' 
      : 'with delivery service';
    
    const paymentMsg = options.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
      ? 'Payment will be collected on delivery.'
      : 'Please complete payment to confirm your order.';
    
    return `Order placed successfully ${deliveryMsg}. ${paymentMsg}`;
  }

  private getCheckoutNextSteps(options: CheckoutOptionsDto): string[] {
    const baseSteps = ['Track your order in the app'];
    
    if (options.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      baseSteps.unshift('Complete payment using the provided link');
    }
    
    if (options.deliveryType === DeliveryType.SELF_SERVICE) {
      baseSteps.push('Visit the vendor location for drop-off and pickup');
    } else {
      baseSteps.push('Vendor will contact you for pickup scheduling');
      baseSteps.push('Items will be delivered to your specified address');
    }
    
    return baseSteps;
  }
}
