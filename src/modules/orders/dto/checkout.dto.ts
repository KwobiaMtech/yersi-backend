import { IsString, IsBoolean, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum DeliveryType {
  SELF_SERVICE = 'self_service',
  DELIVERY_SERVICE = 'delivery_service',
}

export enum PaymentMethod {
  MTN_MOBILE_MONEY = 'mtn_mobile_money',
  VODAFONE_CASH = 'vodafone_cash',
  AIRTELTIGO_MONEY = 'airteltigo_money',
  VISA_CARD = 'visa_card',
  MASTERCARD = 'mastercard',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export class CheckoutOptionsDto {
  @ApiProperty({ enum: DeliveryType, description: 'Delivery type selection' })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method selection' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, description: 'Payment details (phone number, card token, etc.)' })
  @IsString()
  @IsOptional()
  paymentDetails?: string;

  @ApiProperty({ required: false, description: 'Set as default payment method' })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}

export class CheckoutSummaryDto {
  @ApiProperty({ description: 'Order ID for checkout' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Checkout options' })
  @ValidateNested()
  @Type(() => CheckoutOptionsDto)
  checkoutOptions: CheckoutOptionsDto;

  @ApiProperty({ required: false, description: 'Customer notes for the order' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}

export class CheckoutResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  deliveryType: string;

  @ApiProperty({ required: false })
  paymentUrl?: string;

  @ApiProperty({ required: false })
  paymentReference?: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  nextSteps: string[];
}
