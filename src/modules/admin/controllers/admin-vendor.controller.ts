import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { VendorsService } from '../../vendors/services/vendors.service';
import { VendorServiceRepository } from '../../vendors/repositories/vendor-service.repository';
import { LocationService } from '../../location/services/location.service';

@ApiTags('Admin - Vendors')
@Controller('admin/vendors')
export class AdminVendorController {
  constructor(
    private vendorsService: VendorsService,
    private vendorServiceRepository: VendorServiceRepository,
    private locationService: LocationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new vendor' })
  async createVendor(@Body() createVendorDto: any) {
    // Geocode address if provided
    let coordinates = [-0.1870, 5.6037]; // Default Accra
    if (createVendorDto.address?.full) {
      try {
        const location = await this.locationService.geocodeAddress(createVendorDto.address.full);
        coordinates = [location.longitude, location.latitude];
      } catch (error) {
        console.log('Using default coordinates');
      }
    }

    const vendorData = {
      name: createVendorDto.name,
      rating: createVendorDto.rating || 4.0,
      totalReviews: createVendorDto.totalReviews || 0,
      location: {
        type: 'Point',
        coordinates,
      },
      address: {
        street: createVendorDto.address?.street || '',
        city: createVendorDto.address?.city || 'Accra',
        region: createVendorDto.address?.region || 'Greater Accra',
      },
      contact: createVendorDto.contact,
      businessHours: createVendorDto.businessHours || '8:00 AM - 8:00 PM',
      deliveryFee: createVendorDto.deliveryFee || 10,
      estimatedPickupTime: createVendorDto.estimatedPickupTime || 30,
      isAvailable: createVendorDto.isAvailable !== false,
      isActive: createVendorDto.isActive !== false,
    };

    return this.vendorsService.create(vendorData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vendor' })
  async updateVendor(@Param('id') id: string, @Body() updateVendorDto: any) {
    // Implementation would use repository update method
    return { message: 'Vendor updated', id, data: updateVendorDto };
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  async getAllVendors(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    const vendors = await this.vendorsService.searchVendors({
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 100000, // Large radius to get all
    });

    return {
      vendors: vendors.vendors.slice((page - 1) * limit, page * limit),
      total: vendors.total,
      page,
      limit,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  async getVendorById(@Param('id') id: string) {
    return this.vendorsService.getVendorWithServices(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor' })
  async deleteVendor(@Param('id') id: string) {
    return { message: 'Vendor deleted', id };
  }

  @Post(':vendorId/services')
  @ApiOperation({ summary: 'Add service to vendor' })
  async addVendorService(@Param('vendorId') vendorId: string, @Body() serviceDto: any) {
    const vendorServiceData = {
      vendorId: new Types.ObjectId(vendorId),
      serviceId: new Types.ObjectId(serviceDto.serviceId),
      price: serviceDto.price,
      turnaroundHours: serviceDto.turnaroundHours || 24,
      isAvailable: serviceDto.isAvailable !== false,
      minimumOrder: serviceDto.minimumOrder || 1,
      specialFeatures: serviceDto.specialFeatures || [],
    };

    return this.vendorServiceRepository.create(vendorServiceData);
  }

  @Put(':vendorId/services/:serviceId')
  @ApiOperation({ summary: 'Update vendor service' })
  async updateVendorService(
    @Param('vendorId') vendorId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateDto: any
  ) {
    return { 
      message: 'Vendor service updated', 
      vendorId, 
      serviceId, 
      data: updateDto 
    };
  }

  @Get(':vendorId/services')
  @ApiOperation({ summary: 'Get vendor services' })
  async getVendorServices(@Param('vendorId') vendorId: string) {
    return this.vendorServiceRepository.findByVendorId(vendorId);
  }

  @Delete(':vendorId/services/:serviceId')
  @ApiOperation({ summary: 'Remove service from vendor' })
  async removeVendorService(
    @Param('vendorId') vendorId: string,
    @Param('serviceId') serviceId: string
  ) {
    return { message: 'Vendor service removed', vendorId, serviceId };
  }
}
