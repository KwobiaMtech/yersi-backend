import { IsString, IsBoolean, IsOptional, IsMongoId } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  icon: string;

  @IsString()
  colorTheme: string;

  @IsMongoId()
  serviceId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
