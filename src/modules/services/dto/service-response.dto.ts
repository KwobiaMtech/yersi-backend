import { ApiProperty } from '@nestjs/swagger';

export class ServicePackageResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  steps: string[];

  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ServiceResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  minimumOrder: number;

  @ApiProperty({ type: [Number] })
  turnaroundHours: number[];

  @ApiProperty({ type: [String] })
  features: string[];

  @ApiProperty()
  icon: string;

  @ApiProperty()
  colorTheme: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [ServicePackageResponseDto] })
  packages: ServicePackageResponseDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ServicesListResponseDto {
  @ApiProperty({ type: [ServiceResponseDto] })
  services: ServiceResponseDto[];
}
