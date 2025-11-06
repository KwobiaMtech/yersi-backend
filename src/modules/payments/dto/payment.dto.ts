import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/payment.schema';

export class InitializePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  useCredits?: boolean = false;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  creditsAmount?: number = 0;
}