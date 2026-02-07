import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '../schemas/order.schema';
import { OrderCalculationResponseDto, CreateOrderDto } from '../dto/order.dto';

const DEFAULT_ITEM_IMAGE = 'https://s3.us-central-1.wasabisys.com/ys-uploads/defaults/item-placeholder.png';

@Injectable()
export class OrderMappingService {
  toCreateData(createOrderDto: CreateOrderDto, calculation: OrderCalculationResponseDto, userId: string, service: any) {
    return {
      orderNumber: `YRS${Date.now().toString().slice(-6)}`,
      status: OrderStatus.DRAFT,
      userId: userId as any,
      serviceId: createOrderDto.serviceId,
      vendorId: createOrderDto.vendorId as any,
      items: createOrderDto.items.map(item => {
        const unitPrice = calculation.vendorPricing?.itemBreakdown.find(i => i.itemId === item.itemId)?.vendorPrice || service.basePrice;
        const total = calculation.vendorPricing?.itemBreakdown.find(i => i.itemId === item.itemId)?.itemTotal || (item.weight * unitPrice * item.quantity);
        return {
          ...item,
          unitPrice,
          total,
        };
      }),
      pickupAddress: createOrderDto.pickupAddress,
      deliveryAddress: createOrderDto.deliveryAddress,
      preferredPickupTime: createOrderDto.preferredPickupTime ? new Date(createOrderDto.preferredPickupTime) : undefined,
      preferredDeliveryTime: createOrderDto.preferredDeliveryTime ? new Date(createOrderDto.preferredDeliveryTime) : undefined,
      totalWeight: calculation.totalWeight,
      totalItems: calculation.totalItems,
      subtotal: calculation.subtotal,
      deliveryFee: calculation.deliveryFee,
      promoDiscount: calculation.promoDiscount,
      estimatedMinTotal: calculation.estimatedMinTotal,
      estimatedMaxTotal: calculation.estimatedMaxTotal,
      total: calculation.estimatedMaxTotal,
      currency: calculation.currency,
    };
  }

  toResponse(order: Order) {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      userId: order.userId.toString(),
      serviceId: order.serviceId,
      vendorId: order.vendorId?.toString(),
      items: order.items.map(item => ({
        ...item,
        icon: item.icon || DEFAULT_ITEM_IMAGE,
      })),
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      subtotal: order.subtotal,
      totalWeight: order.totalWeight,
      totalItems: order.totalItems,
      deliveryFee: order.deliveryFee,
      promoDiscount: order.promoDiscount,
      estimatedMinTotal: order.estimatedMinTotal,
      estimatedMaxTotal: order.estimatedMaxTotal,
      total: order.total,
      currency: order.currency,
      confirmedAt: order.confirmedAt,
      lockedPricing: order.lockedPricing,
      customerNotes: order.customerNotes,
      deliveryType: order.deliveryType,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      preferredPickupTime: order.preferredPickupTime,
      preferredDeliveryTime: order.preferredDeliveryTime,
      progressPercentage: order.progressPercentage,
      lastStatusUpdate: order.lastStatusUpdate,
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt,
    };
  }

  toResponseList(orders: Order[]) {
    return orders.map(order => this.toResponse(order));
  }

  toDetailedResponse(order: Order, vendor?: any, service?: any) {
    return {
      ...this.toResponse(order),
      vendor: vendor ? {
        id: vendor._id.toString(),
        name: vendor.name,
        deliveryFee: vendor.deliveryFee,
        rating: vendor.rating,
        estimatedPickupTime: vendor.estimatedPickupTime,
      } : null,
      service: service ? {
        id: service._id.toString(),
        name: service.name,
        basePrice: service.basePrice,
        description: service.description,
      } : null,
    };
  }

  toConfirmationDetails(order: Order, vendor: any, service: any, currentPricing: OrderCalculationResponseDto) {
    const isDraft = order.status === OrderStatus.DRAFT;
    const isConfirmed = order.status === OrderStatus.CONFIRMED;
    
    return {
      order: {
        ...this.toResponse(order),
        ...currentPricing,
      },
      vendor: vendor ? {
        id: vendor._id.toString(),
        name: vendor.name,
        deliveryFee: vendor.deliveryFee,
        rating: vendor.rating,
        estimatedPickupTime: vendor.estimatedPickupTime,
      } : null,
      service: service ? {
        id: service._id.toString(),
        name: service.name,
        basePrice: service.basePrice,
        description: service.description,
      } : null,
      pricingBreakdown: currentPricing.vendorPricing || null,
      canConfirm: (isDraft || isConfirmed) && !!order.vendorId,
      confirmationRequired: isDraft,
      isLocked: isConfirmed,
    };
  }

  toCheckoutResponse(order: Order, paymentUrl?: string, paymentReference?: string, message?: string, nextSteps?: string[]) {
    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.total,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      deliveryType: order.deliveryType,
      paymentUrl,
      paymentReference,
      message,
      nextSteps,
    };
  }
}
