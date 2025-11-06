import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AddressAutocompleteDto {
  @ApiProperty({ description: 'Search query for address' })
  @IsString()
  query: string;

  @ApiProperty({ required: false, description: 'Country code (e.g., GH)' })
  @IsOptional()
  @IsString()
  country?: string = 'GH';
}

export class GeocodeAddressDto {
  @ApiProperty({ description: 'Full address to geocode' })
  @IsString()
  address: string;
}

export class DistanceCalculationDto {
  @ApiProperty({ description: 'User latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => parseFloat(value))
  userLatitude: number;

  @ApiProperty({ description: 'User longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => parseFloat(value))
  userLongitude: number;

  @ApiProperty({ description: 'Vendor ID' })
  @IsString()
  vendorId: string;
}

export class NearbyVendorsDto {
  @ApiProperty({ description: 'User latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty({ description: 'User longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiProperty({ required: false, default: 10, description: 'Search radius in km' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  radius?: number = 10;

  @ApiProperty({ required: false, description: 'Service ID filter' })
  @IsOptional()
  @IsString()
  serviceId?: string;
}
