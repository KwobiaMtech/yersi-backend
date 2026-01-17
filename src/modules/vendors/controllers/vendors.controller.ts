import { Controller, Get, Query, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { VendorsService } from '../services/vendors.service';
import { SearchVendorsDto } from '../dto/vendor.dto';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get('search')
  @ApiOperation({ 
    summary: 'Search vendors by location',
    description: 'Search for vendors using coordinates, address, or place ID. Supports distance calculations and flexible sorting.'
  })
  @ApiResponse({
    status: 200,
    description: 'Vendors found successfully',
    schema: {
      example: {
        vendors: [
          {
            id: "507f1f77bcf86cd799439021",
            name: "Clean Express Laundromat",
            address: {
              street: "123 Oxford Street",
              city: "Accra",
              region: "Greater Accra"
            },
            phone: "+233201234567",
            rating: 4.5,
            reviewCount: 128,
            distance: 2.3,
            distanceText: "2.3 km",
            duration: 8,
            durationText: "8 mins",
            distanceStatus: "calculated"
          }
        ],
        total: 1,
        userLocation: {
          latitude: 5.6037,
          longitude: -0.1870
        },
        searchCriteria: {
          radius: 10,
          serviceId: "507f1f77bcf86cd799439011",
          sortBy: "distance",
          includeDistance: true
        }
      }
    }
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(180)
  async searchVendors(@Query() searchDto: SearchVendorsDto) {
    return this.vendorsService.searchVendors(searchDto);
  }

  @Get('service/:serviceId')
  @ApiOperation({ 
    summary: 'Get vendors by service',
    description: 'Get all vendors that offer a specific service'
  })
  @ApiResponse({
    status: 200,
    description: 'Vendors offering the service',
    schema: {
      example: {
        vendors: [
          {
            _id: "507f1f77bcf86cd799439021",
            name: "Clean Express Laundromat",
            rating: 4.5,
            totalReviews: 128,
            address: {
              street: "123 Oxford Street",
              city: "Accra",
              region: "Greater Accra"
            },
            deliveryFee: 10,
            estimatedPickupTime: 30,
            contact: "+233201234567",
            businessHours: "8:00 AM - 8:00 PM",
            serviceDetails: {
              price: 15,
              turnaroundHours: 24,
              isAvailable: true
            }
          }
        ],
        total: 5,
        serviceId: "507f1f77bcf86cd799439011"
      }
    }
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  async getVendorsByService(@Param('serviceId') serviceId: string) {
    return this.vendorsService.getVendorsByService(serviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async getVendor(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Get(':id/services')
  @ApiOperation({ 
    summary: 'Get all services offered by a vendor',
    description: 'Returns all available services that a specific vendor offers with vendor-specific pricing'
  })
  @ApiResponse({
    status: 200,
    description: 'Services offered by the vendor',
    schema: {
      example: {
        vendorId: "507f1f77bcf86cd799439021",
        services: [
          {
            _id: "507f1f77bcf86cd799439011",
            name: "Laundry",
            description: "Basic laundry service",
            icon: "wash",
            colorTheme: "#4CAF50",
            basePrice: 15,
            vendorPrice: 12,
            turnaroundHours: 24,
            minimumOrder: 5,
            specialFeatures: ["Express delivery", "Eco-friendly"],
            isAvailable: true
          },
          {
            _id: "507f1f77bcf86cd799439012",
            name: "Dry Cleaning",
            description: "Professional dry cleaning",
            icon: "dry-clean",
            colorTheme: "#2196F3",
            basePrice: 25,
            vendorPrice: 22,
            turnaroundHours: 48,
            minimumOrder: 3,
            specialFeatures: [],
            isAvailable: true
          }
        ],
        total: 2
      }
    }
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  async getVendorServices(@Param('id') id: string) {
    return this.vendorsService.getVendorServices(id);
  }
}