import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class VendorService extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  serviceId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 'GHS' })
  currency: string;

  @Prop({ required: true })
  turnaroundHours: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: 0 })
  minimumOrder: number;

  @Prop({ type: [String], default: [] })
  specialFeatures: string[];
}

export const VendorServiceSchema = SchemaFactory.createForClass(VendorService);
VendorServiceSchema.index({ vendorId: 1, serviceId: 1 }, { unique: true });
