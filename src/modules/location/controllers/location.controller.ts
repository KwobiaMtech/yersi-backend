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
  @ApiOperation({ summary: 'Find nearby vendors with real coordinates and distances' })
  async findNearbyVendors(@Query() dto: NearbyVendorsDto) {
    // Use enhanced vendor search with distance calculation
    const result = await this.vendorsService.searchVendors({
      latitude: dto.latitude,
      longitude: dto.longitude,
      radius: dto.radius || 10000, // Default 10km radius
      serviceId: dto.serviceId,
      includeDistance: true,
      sortBy: 'distance',
    });

    // Enhance response with additional location data
    const enhancedVendors = result.vendors.map(vendor => ({
      id: vendor._id || vendor.id,
      name: vendor.name,
      rating: vendor.rating,
      totalReviews: vendor.totalReviews,
      address: {
        street: vendor.address?.street || 'N/A',
        city: vendor.address?.city || 'Accra',
        region: vendor.address?.region || 'Greater Accra',
        full: vendor.address ? 
          `${vendor.address.street}, ${vendor.address.city}, ${vendor.address.region}` : 
          'Address not available',
      },
      location: {
        latitude: vendor.location.coordinates[1],
        longitude: vendor.location.coordinates[0],
        coordinates: vendor.location.coordinates,
      },
      services: vendor.servicesOffered || [],
      contact: vendor.contact,
      businessHours: vendor.businessHours,
      deliveryFee: vendor.deliveryFee,
      estimatedPickupTime: vendor.estimatedPickupTime,
      distance: {
        km: vendor.distance,
        text: vendor.distanceText,
        duration: vendor.duration,
        durationText: vendor.durationText,
        status: vendor.distanceStatus,
      },
      isAvailable: vendor.isAvailable,
    }));

    return {
      vendors: enhancedVendors,
      total: result.total,
      userLocation: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      searchRadius: dto.radius || 10000,
      searchCriteria: result.searchCriteria,
      message: result.message,
      suggestions: result.suggestions,
    };
  }
}
