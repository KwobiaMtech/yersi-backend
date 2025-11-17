import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalReviews?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    region?: string;
    full?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessHours?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimatedPickupTime?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateVendorServiceDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  turnaroundHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minimumOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  specialFeatures?: string[];
}
