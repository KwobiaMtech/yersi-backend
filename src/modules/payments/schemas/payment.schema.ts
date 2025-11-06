import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Mongoose, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  MOBILE_MONEY = "mobile_money",
  CREDIT_BALANCE = "credit_balance",
}

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: "Order", required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: "GHS" })
  currency: string;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  gatewayResponse?: object;

  @Prop()
  phone?: string;

  @Prop()
  network?: string;

  @Prop({ default: 0 })
  creditsUsed: number;

  @Prop()
  failureReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
