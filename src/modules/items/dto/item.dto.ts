import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClothingCategory } from '../schemas/item.schema';

export class CreateItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ClothingCategory })
  @IsEnum(ClothingCategory)
  category: ClothingCategory;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number; // Price per kg

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  standardWeight: number; // Standard weight in kg

  @ApiProperty({ required: false, default: 'GHS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsString()
  icon: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careInstructions?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  compatibleServices: string[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ClothingCategory })
  category: ClothingCategory;

  @ApiProperty()
  price: number;

  @ApiProperty()
  standardWeight: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  careInstructions: string[];

  @ApiProperty()
  compatibleServices: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  description?: string;
}

export class GetItemsByCategoryDto {
  @ApiProperty({ enum: ClothingCategory })
  @IsEnum(ClothingCategory)
  category: ClothingCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceId?: string;
}
