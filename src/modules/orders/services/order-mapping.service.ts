import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '../schemas/order.schema';
import { OrderCalculationResponseDto, CreateOrderDto } from '../dto/order.dto';

const DEFAULT_ITEM_IMAGE = 'https://s3.us-central-1.wasabisys.com/ys-uploads/defaults/item-placeholder.png';

@Injectable()
export class OrderMappingService {
  toCreateData(createOrderDto: CreateOrderDto, calculation: OrderCalculationResponseDto, userId: string, service: any) {
    const total = calculation.subtotal + calculation.deliveryFee - calculation.promoDiscount;
    
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
      total: total,
      currency: calculation.currency,
    };
  }

  toResponse(order: Order) {
    const plainOrder = order.toObject ? order.toObject() : order;
    const isVendorPopulated = plainOrder.vendorId && typeof plainOrder.vendorId === 'object' && plainOrder.vendorId._id;
    
    return {
      id: plainOrder._id?.toString() || plainOrder.id,
      orderNumber: plainOrder.orderNumber,
      status: plainOrder.status,
      userId: plainOrder.userId?.toString(),
      serviceId: plainOrder.serviceId,
      vendorId: isVendorPopulated ? plainOrder.vendorId._id.toString() : plainOrder.vendorId?.toString(),
      vendor: isVendorPopulated ? {
        id: plainOrder.vendorId._id.toString(),
        name: plainOrder.vendorId.name,
        businessName: plainOrder.vendorId.businessName,
        phone: plainOrder.vendorId.phone,
        email: plainOrder.vendorId.email,
        deliveryFee: plainOrder.vendorId.deliveryFee,
        rating: plainOrder.vendorId.rating,
        estimatedPickupTime: plainOrder.vendorId.estimatedPickupTime,
      } : null,
      items: plainOrder.items.map(item => ({
        id: item._id?.toString(),
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        categoryId: item.categoryId,
        quantity: item.quantity,
        weight: Math.round(item.weight * 100) / 100,
        unitPrice: item.unitPrice,
        total: item.total,
        specialInstructions: item.specialInstructions,
        icon: item.icon || DEFAULT_ITEM_IMAGE,
      })),
      pickupAddress: plainOrder.pickupAddress,
      deliveryAddress: plainOrder.deliveryAddress,
      subtotal: plainOrder.subtotal,
      totalWeight: Math.round(plainOrder.totalWeight * 100) / 100,
      totalItems: plainOrder.totalItems,
      deliveryFee: plainOrder.deliveryFee,
      promoDiscount: plainOrder.promoDiscount,
      estimatedMinTotal: plainOrder.estimatedMinTotal,
      estimatedMaxTotal: plainOrder.estimatedMaxTotal,
      total: plainOrder.total,
      currency: plainOrder.currency,
      confirmedAt: plainOrder.confirmedAt,
      lockedPricing: plainOrder.lockedPricing,
      customerNotes: plainOrder.customerNotes,
      deliveryType: plainOrder.deliveryType,
      paymentMethod: plainOrder.paymentMethod,
      paymentReference: plainOrder.paymentReference,
      preferredPickupTime: plainOrder.preferredPickupTime,
      preferredDeliveryTime: plainOrder.preferredDeliveryTime,
      progressPercentage: plainOrder.progressPercentage,
      lastStatusUpdate: plainOrder.lastStatusUpdate,
      createdAt: plainOrder.createdAt,
      updatedAt: plainOrder.updatedAt,
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
