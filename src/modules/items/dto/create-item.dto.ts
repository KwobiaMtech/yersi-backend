import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ClothingCategory } from '../schemas/item.schema';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsEnum(ClothingCategory)
  category: ClothingCategory;

  @IsUUID()
  categoryId: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  standardWeight?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  icon: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  careInstructions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  compatibleServices?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
