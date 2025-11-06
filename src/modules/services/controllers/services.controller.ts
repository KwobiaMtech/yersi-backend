import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ServicesService } from '../services/services.service';

@ApiTags('Services')
@Controller('services')
@UseInterceptors(CacheInterceptor)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available services' })
  @CacheTTL(600) // Cache for 10 minutes
  async getServices() {
    return this.servicesService.getServices();
  }
}