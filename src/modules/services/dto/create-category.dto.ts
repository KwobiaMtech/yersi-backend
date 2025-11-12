import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  icon: string;

  @IsString()
  colorTheme: string;

  @IsUUID()
  serviceId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
