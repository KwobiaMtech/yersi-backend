import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppRequestContext } from '../../../common/context/app-request-context';
import { CalculateOrderDto, OrderCalculationResponseDto, CreateOrderDto } from '../dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get context() {
    return AppRequestContext.context;
  }

  async calculateOrder(calculateDto: CalculateOrderDto): Promise<OrderCalculationResponseDto> {
    const cacheKey = `order-calc-${JSON.stringify(calculateDto)}`;
    
    const cached = await this.cacheManager.get<OrderCalculationResponseDto>(cacheKey);
    if (cached) return cached;

    // Calculate totals based on weight and quantity
    let totalWeight = 0;
    let totalItems = 0;
    let subtotal = 0;

    calculateDto.items.forEach(item => {
      totalWeight += item.weight * item.quantity;
      totalItems += item.quantity;
      // Assuming price is per kg, multiply by weight and quantity
      subtotal += (item.weight * 25) * item.quantity; // Mock price of 25 GHS per kg
    });

    const deliveryFee = 5; // Mock delivery fee
    const promoDiscount = calculateDto.promoCode ? 5 : 0; // Mock promo discount
    
    // Estimated range (±20% variation)
    const estimatedMinTotal = Math.round((subtotal + deliveryFee - promoDiscount) * 0.8);
    const estimatedMaxTotal = Math.round((subtotal + deliveryFee - promoDiscount) * 1.2);
    
    const minimumOrderAmount = 100; // Mock minimum order amount
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
    
    await this.cacheManager.set(cacheKey, calculation, 300);
    return calculation;
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    // Calculate order totals
    const calculation = await this.calculateOrder({
      serviceId: createOrderDto.serviceId,
      vendorId: createOrderDto.vendorId,
      items: createOrderDto.items,
    });

    // Mock order creation with weight-based data
    const order = {
      id: `ORD-${Date.now()}`,
      orderNumber: `YRS${Date.now().toString().slice(-6)}`,
      status: 'pending',
      userId: this.context.userId,
      ...createOrderDto,
      ...calculation,
      total: calculation.estimatedMaxTotal, // Use max estimate for order total
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
      status: 'pending',
      totalWeight: 4,
      totalItems: 4,
      estimatedMinTotal: 95,
      estimatedMaxTotal: 120,
      currency: 'GHS',
    };
  }
}
