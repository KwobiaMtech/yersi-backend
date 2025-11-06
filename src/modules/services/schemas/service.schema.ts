import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Service extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ default: 'GHS' })
  currency: string;

  @Prop({ required: true })
  minimumOrder: number;

  @Prop({ type: [Number], required: true })
  turnaroundHours: number[];

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  colorTheme: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);