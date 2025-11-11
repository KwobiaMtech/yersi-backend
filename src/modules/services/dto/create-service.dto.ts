import { IsString, IsNumber, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  basePrice: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  minimumOrder: number;

  @IsArray()
  @IsNumber({}, { each: true })
  turnaroundHours: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsString()
  icon: string;

  @IsString()
  colorTheme: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
