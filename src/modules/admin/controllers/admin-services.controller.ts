import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { AdminApiKeyGuard } from '../guards/admin-api-key.guard';
import { ServicesRepository } from '../../services/repositories/services.repository';
import { ServicePackageRepository } from '../../services/repositories/service-package.repository';
import { CategoryRepository } from '../../services/repositories/category.repository';
import { CreateServiceDto } from '../../services/dto/create-service.dto';
import { CreateServicePackageDto } from '../../services/dto/create-service-package.dto';
import { CreateCategoryDto } from '../../services/dto/create-category.dto';

@ApiTags('Admin - Services')
@Controller('admin/services')
@UseGuards(AdminApiKeyGuard)
@ApiHeader({ name: 'x-admin-api-key', description: 'Admin API Key' })
export class AdminServicesController {
  constructor(
    private servicesRepository: ServicesRepository,
    private servicePackageRepository: ServicePackageRepository,
    private categoryRepository: CategoryRepository
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  async createService(@Body() serviceData: CreateServiceDto) {
    return this.servicesRepository.create(serviceData);
  }

  @Post('packages')
  @ApiOperation({ summary: 'Create a new service package' })
  async createServicePackage(@Body() packageData: CreateServicePackageDto) {
    const packageWithObjectId = {
      ...packageData,
      serviceId: new Types.ObjectId(packageData.serviceId)
    };
    return this.servicePackageRepository.create(packageWithObjectId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  async createCategory(@Body() categoryData: CreateCategoryDto) {
    const categoryWithObjectId = {
      ...categoryData,
      serviceId: new Types.ObjectId(categoryData.serviceId)
    };
    return this.categoryRepository.create(categoryWithObjectId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return this.categoryRepository.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  async getAllServices() {
    const services = await this.servicesRepository.findAll();
    return {
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        currency: service.currency,
        minimumOrder: service.minimumOrder,
        turnaroundHours: service.turnaroundHours,
        features: service.features,
        icon: service.icon,
        colorTheme: service.colorTheme,
        isActive: service.isActive
      }))
    };
  }
}
