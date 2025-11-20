import { IsString, IsBoolean, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MobileMoneyProvider {
  MTN = 'mtn',
  TELECEL = 'telecel',
  AIRTELTIGO = 'airteltigo',
}

export enum PaymentMethodType {
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
}

export class AddMobileMoneyDto {
  @ApiProperty({ description: 'Phone number for mobile money account' })
  @IsPhoneNumber('GH')
  phoneNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  accountName: string;

  @ApiProperty({ enum: MobileMoneyProvider, description: 'Mobile money network provider' })
  @IsEnum(MobileMoneyProvider)
  provider: MobileMoneyProvider;

  @ApiProperty({ required: false, description: 'Set as default payment method' })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;

  @ApiProperty({ required: false, description: 'Custom nickname for this payment method' })
  @IsString()
  @IsOptional()
  nickname?: string;
}

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PaymentMethodType })
  type: PaymentMethodType;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  maskedDetails: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  nickname?: string;

  @ApiProperty({ required: false, enum: MobileMoneyProvider })
  provider?: MobileMoneyProvider;
}

export class UpdatePaymentMethodDto {
  @ApiProperty({ required: false, description: 'Update nickname' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ required: false, description: 'Set as default payment method' })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}
