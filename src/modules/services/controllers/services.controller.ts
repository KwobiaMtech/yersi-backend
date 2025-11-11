import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ServicesService } from '../services/services.service';

@ApiTags('Services')
@Controller('services')
@UseInterceptors(CacheInterceptor)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  @CacheTTL(600)
  async getServices() {
    return this.servicesService.getServices();
  }

  @Get(':serviceId/packages')
  @ApiOperation({ summary: 'Get packages for a service' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service packages' })
  @CacheTTL(600)
  async getServicePackages(@Param('serviceId') serviceId: string) {
    return this.servicesService.getServicePackages(serviceId);
  }

  @Get(':serviceId/categories')
  @ApiOperation({ summary: 'Get categories for a service' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service categories' })
  @CacheTTL(600)
  async getServiceCategories(@Param('serviceId') serviceId: string) {
    return this.servicesService.getServiceCategories(serviceId);
  }

  @Get('categories/:categoryId/items')
  @ApiOperation({ summary: 'Get items for a category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category items' })
  @CacheTTL(600)
  async getCategoryItems(@Param('categoryId') categoryId: string) {
    return this.servicesService.getCategoryItems(categoryId);
  }
}