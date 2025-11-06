import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Promotion extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  discountType: 'fixed' | 'percentage';

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 0 })
  minimumOrderAmount: number;

  @Prop({ default: null })
  maxDiscountAmount?: number;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ default: null })
  usageLimit?: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFirstTimeUserOnly: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);