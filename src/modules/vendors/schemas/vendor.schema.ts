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

  @Prop({ type: [String], required: true })
  servicesOffered: string[];

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ default: 30 })
  estimatedPickupTime: number;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
VendorSchema.index({ location: '2dsphere' });