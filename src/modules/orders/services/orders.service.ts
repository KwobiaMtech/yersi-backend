import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppRequestContext } from '../../../common/context/app-request-context';
import { CalculateOrderDto, OrderCalculationResponseDto, CreateOrderDto, UpdateOrderDto, ConfirmOrderDto } from '../dto/order.dto';
import { CheckoutOptionsDto, CheckoutSummaryDto, DeliveryType, PaymentMethod } from '../dto/checkout.dto';
import { ServicesRepository } from '../../services/repositories/services.repository';
import { VendorsRepository } from '../../vendors/repositories/vendors.repository';
import { VendorServiceRepository } from '../../vendors/repositories/vendor-service.repository';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrderMappingService } from './order-mapping.service';
import { PaymentMethodsService } from './payment-methods.service';
import { OrderStatus } from '../schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private servicesRepository: ServicesRepository,
    private vendorsRepository: VendorsRepository,
    private vendorServiceRepository: VendorServiceRepository,
    private ordersRepository: OrdersRepository,
    private orderMapper: OrderMappingService,
    private paymentMethodsService: PaymentMethodsService,
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

    const DEFAULT_DELIVERY_FEE = 5;
    const PROMO_DISCOUNT_AMOUNT = 5;
    const WEIGHT_VARIATION_PERCENTAGE = 0.2; // ±20%
    const MINIMUM_ORDER_AMOUNT = 100;

    let deliveryFee = DEFAULT_DELIVERY_FEE;
    let servicePrice = service.basePrice;
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

    const promoDiscount = calculateDto.promoCode ? PROMO_DISCOUNT_AMOUNT : 0;
    
    // Estimated range (±20% variation) - based on subtotal only
    const estimatedMinTotal = Math.round((subtotal * (1 - WEIGHT_VARIATION_PERCENTAGE)) + deliveryFee - promoDiscount);
    const estimatedMaxTotal = Math.round((subtotal * (1 + WEIGHT_VARIATION_PERCENTAGE)) + deliveryFee - promoDiscount);
    
    const currentTotal = subtotal + deliveryFee - promoDiscount;
    const minimumOrderMet = currentTotal >= MINIMUM_ORDER_AMOUNT;
    const needsAdditionalAmount = minimumOrderMet ? 0 : MINIMUM_ORDER_AMOUNT - currentTotal;

    const calculation: OrderCalculationResponseDto = {
      totalWeight,
      totalItems,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      promoDiscount,
      estimatedMinTotal,
      estimatedMaxTotal,
      currency: 'GHS',
      needsAdditionalAmount: Math.max(0, needsAdditionalAmount),
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
        comparedToBase: Math.round(((baseSubtotal + DEFAULT_DELIVERY_FEE) - (subtotal + deliveryFee)) * 100) / 100,
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

    // Create order in database
    const orderData = this.orderMapper.toCreateData(createOrderDto, calculation, this.context.userId, service);
    const order = await this.ordersRepository.create(orderData);
    
    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return this.orderMapper.toResponse(order);
  }

  async getUserOrders() {
    const cacheKey = `user-orders-${this.context.userId}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const orders = await this.ordersRepository.findByUserId(this.context.userId);
    const mapped = this.orderMapper.toResponseList(orders);
    
    await this.cacheManager.set(cacheKey, mapped, 120);
    return mapped;
  }

  async getOrderById(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return this.orderMapper.toResponse(order);
  }

  async getOrderWithDetails(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get vendor details if order has vendor
    let vendorDetails = null;
    if (order.vendorId) {
      vendorDetails = await this.vendorsRepository.findById(order.vendorId.toString());
    }

    // Get service details
    let serviceDetails = null;
    if (order.serviceId) {
      serviceDetails = await this.servicesRepository.findById(order.serviceId);
    }

    return this.orderMapper.toDetailedResponse(order, vendorDetails, serviceDetails);
  }

  async getOrderConfirmationDetails(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get current pricing with vendor if selected
    let currentPricing = null;
    if (order.vendorId) {
      currentPricing = await this.calculateOrder({
        serviceId: order.serviceId,
        vendorId: order.vendorId.toString(),
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
      vendorDetails = await this.vendorsRepository.findById(order.vendorId.toString());
    }

    // Get service details
    const serviceDetails = await this.servicesRepository.findById(order.serviceId);

    return this.orderMapper.toConfirmationDetails(order, vendorDetails, serviceDetails, currentPricing);
  }

  async updateOrderVendor(orderId: string, vendorId: string) {
    // Validate vendor exists
    const vendor = await this.vendorsRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Get existing order
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Prevent updates to confirmed orders
    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('Cannot update confirmed order');
    }

    // Validate vendor offers the service
    const vendorServices = await this.vendorServiceRepository.findByVendorId(vendorId);
    const vendorService = vendorServices.find(vs => vs.serviceId.toString() === order.serviceId);
    
    if (!vendorService || !vendorService.isAvailable) {
      throw new BadRequestException(`Vendor does not offer this service or service is unavailable`);
    }

    // Recalculate with new vendor
    const calculation = await this.calculateOrder({
      serviceId: order.serviceId,
      vendorId,
      items: order.items,
    });

    // Update order
    order.vendorId = vendorId as any;
    order.deliveryFee = calculation.deliveryFee;
    order.subtotal = calculation.subtotal;
    order.estimatedMinTotal = calculation.estimatedMinTotal;
    order.estimatedMaxTotal = calculation.estimatedMaxTotal;
    order.total = calculation.estimatedMaxTotal;
    
    const updatedOrder = await order.save();
    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return this.orderMapper.toResponse(updatedOrder);
  }

  async updateOrder(orderId: string, updateDto: UpdateOrderDto) {
    // Get existing order
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Prevent updates to confirmed orders
    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('Cannot update confirmed order. Contact support for changes.');
    }

    // Validate service if being updated
    if (updateDto.serviceId) {
      const service = await this.servicesRepository.findById(updateDto.serviceId);
      if (!service) {
        throw new NotFoundException(`Service with ID ${updateDto.serviceId} not found`);
      }
      order.serviceId = updateDto.serviceId;
    }

    // Validate vendor if being updated
    if (updateDto.vendorId) {
      const vendor = await this.vendorsRepository.findById(updateDto.vendorId);
      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${updateDto.vendorId} not found`);
      }

      // Check if vendor offers the service
      const serviceId = updateDto.serviceId || order.serviceId;
      const vendorServices = await this.vendorServiceRepository.findByVendorId(updateDto.vendorId);
      const vendorService = vendorServices.find(vs => vs.serviceId.toString() === serviceId);
      
      if (!vendorService || !vendorService.isAvailable) {
        throw new BadRequestException(`Vendor does not offer this service or service is unavailable`);
      }
      order.vendorId = updateDto.vendorId as any;
    }

    // Update addresses if provided
    if (updateDto.pickupAddress) order.pickupAddress = updateDto.pickupAddress;
    if (updateDto.deliveryAddress) order.deliveryAddress = updateDto.deliveryAddress;
    if (updateDto.preferredPickupTime) order.preferredPickupTime = new Date(updateDto.preferredPickupTime);
    if (updateDto.preferredDeliveryTime) order.preferredDeliveryTime = new Date(updateDto.preferredDeliveryTime);

    // Recalculate totals if items or vendor changed
    if (updateDto.items || updateDto.vendorId || updateDto.serviceId) {
      const calculation = await this.calculateOrder({
        serviceId: order.serviceId,
        vendorId: order.vendorId?.toString(),
        items: updateDto.items || order.items,
      });

      if (updateDto.items) {
        const service = await this.servicesRepository.findById(order.serviceId);
        order.items = updateDto.items.map(item => ({
          ...item,
          unitPrice: calculation.vendorPricing?.itemBreakdown.find(i => i.itemId === item.itemId)?.vendorPrice || service.basePrice,
          total: calculation.vendorPricing?.itemBreakdown.find(i => i.itemId === item.itemId)?.itemTotal || 0,
        }));
      }

      order.totalWeight = calculation.totalWeight;
      order.totalItems = calculation.totalItems;
      order.subtotal = calculation.subtotal;
      order.deliveryFee = calculation.deliveryFee;
      order.promoDiscount = calculation.promoDiscount;
      order.estimatedMinTotal = calculation.estimatedMinTotal;
      order.estimatedMaxTotal = calculation.estimatedMaxTotal;
      order.total = calculation.estimatedMaxTotal;
    }

    const updatedOrder = await order.save();
    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return this.orderMapper.toResponse(updatedOrder);
  }

  async confirmOrder(orderId: string, confirmDto: ConfirmOrderDto) {
    // Get existing order
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if already confirmed
    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order is already confirmed');
    }

    // Validate vendor is selected
    if (!order.vendorId) {
      throw new BadRequestException('Please select a vendor before confirming order');
    }

    // Get final pricing calculation
    const finalPricing = await this.calculateOrder({
      serviceId: order.serviceId,
      vendorId: order.vendorId.toString(),
      items: order.items,
    });

    // Get vendor details for locked pricing
    const vendor = await this.vendorsRepository.findById(order.vendorId.toString());
    const vendorServices = await this.vendorServiceRepository.findByVendorId(order.vendorId.toString());
    const vendorService = vendorServices.find(vs => vs.serviceId.toString() === order.serviceId);

    // Lock in pricing at confirmation
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    order.customerNotes = confirmDto.customerNotes;
    order.lockedPricing = {
      vendorId: vendor._id.toString(),
      vendorName: vendor.name,
      servicePrice: vendorService.price,
      deliveryFee: vendor.deliveryFee,
      subtotal: finalPricing.subtotal,
      total: finalPricing.estimatedMaxTotal,
      confirmedAt: new Date(),
    };
    order.subtotal = finalPricing.subtotal;
    order.deliveryFee = finalPricing.deliveryFee;
    order.total = finalPricing.estimatedMaxTotal;

    const confirmedOrder = await order.save();
    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    
    return {
      ...this.orderMapper.toResponse(confirmedOrder),
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

    // Fetch user's saved payment methods from database
    const savedPaymentMethods = await this.paymentMethodsService.getUserPaymentMethods();

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
          description: orderDetails.order.deliveryAddress?.formattedAddress || 'Delivery to your address',
          fee: orderDetails.order.deliveryFee,
          estimatedTime: '30-45 minutes',
        },
      ],
      paymentMethods: savedPaymentMethods,
      canAddPaymentMethod: true,
    };
  }

  async processCheckout(checkoutDto: CheckoutSummaryDto) {
    // Get order
    const order = await this.ordersRepository.findById(checkoutDto.orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${checkoutDto.orderId} not found`);
    }

    // Validate order can be checked out
    if (order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order cannot be checked out');
    }

    // Adjust pricing based on delivery type
    let finalTotal = order.total;
    if (checkoutDto.checkoutOptions.deliveryType === DeliveryType.SELF_SERVICE) {
      finalTotal = order.subtotal; // Remove delivery fee
      order.deliveryFee = 0;
    }

    // Confirm order if still draft
    if (order.status === OrderStatus.DRAFT) {
      if (!order.vendorId) {
        throw new BadRequestException('Please select a vendor before checkout');
      }
      
      const vendor = await this.vendorsRepository.findById(order.vendorId.toString());
      const vendorServices = await this.vendorServiceRepository.findByVendorId(order.vendorId.toString());
      const vendorService = vendorServices.find(vs => vs.serviceId.toString() === order.serviceId);

      order.status = OrderStatus.CONFIRMED;
      order.confirmedAt = new Date();
      order.lockedPricing = {
        vendorId: vendor._id.toString(),
        vendorName: vendor.name,
        servicePrice: vendorService.price,
        deliveryFee: order.deliveryFee,
        subtotal: order.subtotal,
        total: finalTotal,
        confirmedAt: new Date(),
      };
    }

    // Process payment
    const paymentResult = await this.processPayment(
      checkoutDto.checkoutOptions.paymentMethod,
      finalTotal,
      checkoutDto.checkoutOptions.paymentDetails
    );

    // Update order with checkout details
    order.deliveryType = checkoutDto.checkoutOptions.deliveryType;
    order.paymentMethod = checkoutDto.checkoutOptions.paymentMethod;
    order.paymentReference = paymentResult.reference;
    order.customerNotes = checkoutDto.customerNotes;
    order.total = finalTotal;
    
    if (!paymentResult.requiresConfirmation) {
      order.status = OrderStatus.PENDING;
    }

    const updatedOrder = await order.save();
    await this.cacheManager.del(`user-orders-${this.context.userId}`);

    return this.orderMapper.toCheckoutResponse(
      updatedOrder,
      paymentResult.paymentUrl,
      paymentResult.reference,
      this.getCheckoutMessage(checkoutDto.checkoutOptions),
      this.getCheckoutNextSteps(checkoutDto.checkoutOptions)
    );
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
