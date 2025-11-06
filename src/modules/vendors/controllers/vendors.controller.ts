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

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async getVendor(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }
}