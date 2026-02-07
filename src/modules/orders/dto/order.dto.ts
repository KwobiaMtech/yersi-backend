import { IsNumber, IsString, IsArray, IsOptional, IsDateString, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty()
  @IsString()
  itemId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  weight: number; // Weight in kg

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

class AddressDto {
  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  region: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ required: false, description: 'Google Place ID from location autocomplete' })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiProperty({ required: false, description: 'Latitude from geocoding' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false, description: 'Longitude from geocoding' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false, description: 'Formatted address from Google' })
  @IsOptional()
  @IsString()
  formattedAddress?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty({ required: false, description: 'Vendor ID - customer can change vendor' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  preferredPickupTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  preferredDeliveryTime?: string;
}

export class CalculateOrderDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty({ required: false, description: 'Vendor ID for pricing calculation' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class OrderCalculationResponseDto {
  @ApiProperty()
  totalWeight: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  promoDiscount: number;

  @ApiProperty()
  estimatedMinTotal: number;

  @ApiProperty()
  estimatedMaxTotal: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  needsAdditionalAmount?: number; // Amount needed to reach minimum order

  @ApiProperty()
  minimumOrderMet: boolean;

  @ApiProperty({ required: false })
  vendorPricing?: {
    vendor: {
      id: string;
      name: string;
      deliveryFee: number;
    };
    itemBreakdown: Array<{
      itemId: string;
      name: string;
      basePrice: number;
      vendorPrice: number;
      quantity: number;
      weight: number;
      itemTotal: number;
      savings: number;
    }>;
    comparedToBase: number;
  };
}

export class UpdateOrderVendorDto {
  @ApiProperty({ description: 'New vendor ID for the order' })
  @IsString()
  vendorId: string;
}

export class UpdateOrderDto {
  @ApiProperty({ required: false, description: 'Update vendor ID' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({ required: false, description: 'Update service ID' })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ type: [OrderItemDto], required: false, description: 'Update order items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];

  @ApiProperty({ required: false, description: 'Update pickup address' })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  pickupAddress?: AddressDto;

  @ApiProperty({ required: false, description: 'Update delivery address' })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  deliveryAddress?: AddressDto;

  @ApiProperty({ required: false, description: 'Update preferred pickup time' })
  @IsOptional()
  @IsDateString()
  preferredPickupTime?: string;

  @ApiProperty({ required: false, description: 'Update preferred delivery time' })
  @IsOptional()
  @IsDateString()
  preferredDeliveryTime?: string;
}

export class ConfirmOrderDto {
  @ApiProperty({ description: 'Confirm final pricing and vendor selection' })
  @IsBoolean()
  confirmPricing: boolean;

  @ApiProperty({ required: false, description: 'Customer notes for the order' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}