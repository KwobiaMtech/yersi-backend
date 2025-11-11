import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_WASH = 'in_wash',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  serviceId: string;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: false })
  vendorId?: Types.ObjectId;

  @Prop([{
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    categoryId: { type: String, required: true },
    quantity: { type: Number, required: true },
    weight: { type: Number, required: true }, // in kg
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    specialInstructions: String,
  }])
  items: Array<{
    itemId: string;
    name: string;
    category: string;
    categoryId: string;
    quantity: number;
    weight: number;
    unitPrice: number;
    total: number;
    specialInstructions?: string;
  }>;

  @Prop({ type: Object })
  pickupAddress: {
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    phone: string;
    instructions?: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  };

  @Prop({ type: Object })
  deliveryAddress: {
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    phone: string;
    placeId?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
  };

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  totalWeight: number; // Total weight in kg

  @Prop({ required: true })
  totalItems: number; // Total number of items

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ default: 0 })
  promoDiscount: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  estimatedMinTotal: number; // Minimum estimated total

  @Prop({ required: true })
  estimatedMaxTotal: number; // Maximum estimated total

  @Prop({ default: 'GHS' })
  currency: string;

  @Prop({ enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop()
  preferredPickupTime?: Date;

  @Prop()
  preferredDeliveryTime?: Date;

  @Prop({ default: 0 })
  progressPercentage: number;

  @Prop()
  lastStatusUpdate?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);