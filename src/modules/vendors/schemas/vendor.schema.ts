import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Vendor extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    region: string;
  };

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ default: 30 })
  estimatedPickupTime: number;

  @Prop()
  contact: string;

  @Prop({ default: '8:00 AM - 8:00 PM' })
  businessHours: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
VendorSchema.index({ location: '2dsphere' });