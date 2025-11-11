import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum ClothingCategory {
  NIGHTWEAR = 'nightwear',
  ACCESSORIES = 'accessories', 
  OCCASIONAL_WEAR = 'occasional_wear',
  UNDERWEAR = 'underwear',
  TOP = 'top',
  BOTTOM = 'bottom',
}

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true, unique: true, default: () => uuidv4() })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: Object.values(ClothingCategory), required: true })
  category: ClothingCategory;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  price: number; // Price per kg

  @Prop({ required: true, default: 1 })
  standardWeight: number; // Standard weight in kg for this item type

  @Prop({ default: 'GHS' })
  currency: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ type: [String], default: [] })
  careInstructions: string[];

  @Prop({ type: [String], required: true })
  compatibleServices: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  description?: string;
}

export const ItemSchema = SchemaFactory.createForClass(Item);