import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  VENDOR_ADMIN = 'vendor_admin',
}

@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: AdminRole })
  role: AdminRole;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: false })
  vendorId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop([String])
  permissions: string[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
