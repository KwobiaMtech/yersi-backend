import { Controller, Get, Query, Post, Body, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationService } from '../services/location.service';
import { VendorsService } from '../../vendors/services/vendors.service';
import { 
  AddressAutocompleteDto, 
  GeocodeAddressDto, 
  DistanceCalculationDto,
  NearbyVendorsDto 
} from '../dto/location.dto';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(
    private locationService: LocationService,
    @Inject(forwardRef(() => VendorsService))
    private vendorsService: VendorsService,
  ) {}

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get address autocomplete suggestions' })
  async autocompleteAddress(@Query() dto: AddressAutocompleteDto) {
    return this.locationService.autocompleteAddress(dto.query, dto.country);
  }

  @Post('geocode')
  @ApiOperation({ summary: 'Convert address to coordinates' })
  async geocodeAddress(@Body() dto: GeocodeAddressDto) {
    return this.locationService.geocodeAddress(dto.address);
  }

  @Get('place-details')
  @ApiOperation({ summary: 'Get place details from place ID' })
  async getPlaceDetails(@Query('placeId') placeId: string) {
    return this.locationService.getPlaceDetails(placeId);
  }

  @Post('distance')
  @ApiOperation({ summary: 'Calculate distance between user and vendor' })
  async calculateDistance(@Body() dto: DistanceCalculationDto) {
    const vendor = await this.vendorsService.getVendorById(dto.vendorId);
    const [vendorLng, vendorLat] = vendor.location.coordinates;
    
    const distance = await this.locationService.calculateDistance(
      dto.userLatitude,
      dto.userLongitude,
      vendorLat,
      vendorLng,
    );

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        address: vendor.address,
        coordinates: { latitude: vendorLat, longitude: vendorLng },
      },
      userLocation: {
        latitude: dto.userLatitude,
        longitude: dto.userLongitude,
      },
      ...distance,
    };
  }

  @Get('nearby-vendors')
  @ApiOperation({ summary: 'Find nearby vendors with distances' })
  async findNearbyVendors(@Query() dto: NearbyVendorsDto) {
    const vendors = await this.vendorsService.searchVendors({
      latitude: dto.latitude,
      longitude: dto.longitude,
      radius: dto.radius,
      serviceId: dto.serviceId,
    });

    const vendorsWithDistance = await Promise.all(
      vendors.map(async (vendor) => {
        const [vendorLng, vendorLat] = vendor.location.coordinates;
        const distance = await this.locationService.calculateDistance(
          dto.latitude,
          dto.longitude,
          vendorLat,
          vendorLng,
        );

        return {
          ...vendor.toObject(),
          distance: distance.distance,
          distanceText: distance.distanceText,
          duration: distance.duration,
          durationText: distance.durationText,
          distanceStatus: distance.status,
        };
      }),
    );

    return vendorsWithDistance.sort((a, b) => a.distance - b.distance);
  }
}
