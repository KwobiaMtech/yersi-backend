import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AppRequestContext } from '../../../common/context/app-request-context';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get context() {
    return AppRequestContext.context;
  }

  async calculateOrder(calculateDto: any) {
    const cacheKey = `order-calc-${JSON.stringify(calculateDto)}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Mock calculation
    const calculation = { total: 25.50, tax: 2.50, subtotal: 23.00 };
    
    await this.cacheManager.set(cacheKey, calculation, 300);
    return calculation;
  }

  async createOrder(createOrderDto: any) {
    // Mock order creation
    const order = { id: '123', status: 'pending', ...createOrderDto };
    
    await this.cacheManager.del(`user-orders-${this.context.userId}`);
    return order;
  }

  async getUserOrders() {
    const cacheKey = `user-orders-${this.context.userId}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Mock orders
    const orders = [{ id: '123', status: 'pending' }];
    
    await this.cacheManager.set(cacheKey, orders, 120);
    return orders;
  }

  async getOrderById(orderId: string) {
    return { id: orderId, status: 'pending' };
  }
}
