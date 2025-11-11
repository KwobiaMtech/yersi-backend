import { IsString, IsArray, IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class CreateServicePackageDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  steps: string[];

  @IsMongoId()
  serviceId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
