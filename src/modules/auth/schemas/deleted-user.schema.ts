import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DeletedUser extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 0 })
  credits: number;

  @Prop()
  refreshToken?: string;

  @Prop()
  deletedAt: Date;
}

export const DeletedUserSchema = SchemaFactory.createForClass(DeletedUser);
