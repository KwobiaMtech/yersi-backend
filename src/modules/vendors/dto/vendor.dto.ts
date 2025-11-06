import { IsNumber, IsString, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchVendorsDto {
  @ApiProperty({ required: false, description: 'User latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiProperty({ required: false, description: 'User longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiProperty({ required: false, description: 'User address to search from' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, description: 'Place ID from location autocomplete' })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiProperty({ required: false, description: 'Service ID filter' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ required: false, default: 10, description: 'Search radius in km' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  radius?: number = 10;

  @ApiProperty({ required: false, default: false, description: 'Include distance calculations' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDistance?: boolean = false;

  @ApiProperty({ required: false, description: 'Sort by: distance, rating, name' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'distance';
}