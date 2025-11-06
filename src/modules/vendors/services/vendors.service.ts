import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { VendorsRepository } from '../repositories/vendors.repository';
import { SearchVendorsDto } from '../dto/vendor.dto';
import { Vendor } from '../schemas/vendor.schema';
import { LocationService } from '../../location/services/location.service';

@Injectable()
export class VendorsService {
  constructor(
    private vendorsRepository: VendorsRepository,
    @Inject(forwardRef(() => LocationService))
    private locationService: LocationService,
  ) {}

  async searchVendors(searchDto: SearchVendorsDto): Promise<any> {
    let userLat: number;
    let userLng: number;

    // Get user coordinates from different input methods
    if (searchDto.latitude && searchDto.longitude) {
      userLat = searchDto.latitude;
      userLng = searchDto.longitude;
    } else if (searchDto.placeId) {
      const location = await this.locationService.getPlaceDetails(searchDto.placeId);
      userLat = location.latitude;
      userLng = location.longitude;
    } else if (searchDto.address) {
      const location = await this.locationService.geocodeAddress(searchDto.address);
      userLat = location.latitude;
      userLng = location.longitude;
    } else {
      // Return all vendors without location filtering
      const vendors = await this.vendorsRepository.findAll(searchDto.serviceId);
      return this.formatVendorResponse(vendors, searchDto);
    }

    // Search vendors near the user location
    const vendors = await this.vendorsRepository.findNearby(
      userLng,
      userLat,
      searchDto.serviceId,
      searchDto.radius,
    );

    // Add distance calculations if requested
    if (searchDto.includeDistance && vendors.length > 0) {
      const vendorsWithDistance = await Promise.all(
        vendors.map(async (vendor) => {
          const [vendorLng, vendorLat] = vendor.location.coordinates;
          const distance = await this.locationService.calculateDistance(
            userLat,
            userLng,
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

      return this.formatVendorResponse(vendorsWithDistance, searchDto, { userLat, userLng });
    }

    return this.formatVendorResponse(vendors, searchDto, { userLat, userLng });
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    return this.vendorsRepository.findById(id);
  }

  private formatVendorResponse(vendors: any[], searchDto: SearchVendorsDto, userLocation?: { userLat: number; userLng: number }) {
    // Sort vendors
    let sortedVendors = [...vendors];
    
    switch (searchDto.sortBy) {
      case 'rating':
        sortedVendors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        sortedVendors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'distance':
      default:
        if (searchDto.includeDistance) {
          sortedVendors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
    }

    const response: any = {
      vendors: sortedVendors,
      total: sortedVendors.length,
      searchCriteria: {
        radius: searchDto.radius,
        serviceId: searchDto.serviceId,
        sortBy: searchDto.sortBy,
        includeDistance: searchDto.includeDistance,
      },
    };

    if (userLocation) {
      response.userLocation = {
        latitude: userLocation.userLat,
        longitude: userLocation.userLng,
      };
    }

    if (sortedVendors.length === 0) {
      response.message = 'No vendors found in your area. Try increasing the search radius or removing service filters.';
      response.suggestions = [
        'Increase search radius to 20km',
        'Remove service type filter',
        'Check if your location is correct',
      ];
    }

    return response;
  }
}