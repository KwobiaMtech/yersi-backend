import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ServicePackage extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: true })
  steps: string[];

  @Prop({ type: String, ref: 'Service', required: true })
  serviceId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ServicePackageSchema = SchemaFactory.createForClass(ServicePackage);
