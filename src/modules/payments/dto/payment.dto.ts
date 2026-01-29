import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/payment.schema';

export class InitializePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Phone number for mobile money' })
  @IsPhoneNumber('GH')
  phoneNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  accountName: string;

  @ApiProperty({ description: 'Mobile money provider (MTN, VODAFONE, AIRTELTIGO)' })
  @IsString()
  mobileMoneyProvider: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  useCredits?: boolean = false;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  creditsAmount?: number = 0;
}

export class CheckPaymentStatusDto {
  @ApiProperty()
  @IsString()
  transactionId: string;
}