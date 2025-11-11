import { IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetServiceByIdDto {
  @ApiProperty({ description: 'Service ID' })
  @IsString()
  id: string;
}
