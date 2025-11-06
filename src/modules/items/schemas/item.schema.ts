import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  price: number;

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
}

export const ItemSchema = SchemaFactory.createForClass(Item);