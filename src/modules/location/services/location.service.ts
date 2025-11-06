import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationProvider } from '../interfaces/location-provider.interface';
import { GoogleMapsProvider } from '../providers/google-maps.provider';
import { MapboxProvider } from '../providers/mapbox.provider';
import { NominatimProvider } from '../providers/nominatim.provider';

@Injectable()
export class LocationService {
  private provider: LocationProvider;

  constructor(
    private configService: ConfigService,
    private googleMapsProvider: GoogleMapsProvider,
    private mapboxProvider: MapboxProvider,
    private nominatimProvider: NominatimProvider,
  ) {
    this.initializeProvider();
  }

  private initializeProvider() {
    const providerType = this.configService.get<string>('LOCATION_PROVIDER', 'google').toLowerCase();
    
    switch (providerType) {
      case 'mapbox':
        this.provider = this.mapboxProvider;
        break;
      case 'nominatim':
        this.provider = this.nominatimProvider;
        break;
      case 'google':
      default:
        this.provider = this.googleMapsProvider;
        break;
    }
  }

  async autocompleteAddress(query: string, country: string = 'GH') {
    try {
      return await this.provider.autocompleteAddress(query, country);
    } catch (error) {
      throw new HttpException('Failed to fetch address suggestions', HttpStatus.BAD_REQUEST);
    }
  }

  async geocodeAddress(address: string) {
    try {
      return await this.provider.geocodeAddress(address);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to geocode address', HttpStatus.BAD_REQUEST);
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      if (this.provider.getPlaceDetails) {
        return await this.provider.getPlaceDetails(placeId);
      }
      throw new HttpException('Place details not supported by current provider', HttpStatus.NOT_IMPLEMENTED);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to get place details', HttpStatus.BAD_REQUEST);
    }
  }

  async calculateDistance(userLat: number, userLng: number, vendorLat: number, vendorLng: number) {
    try {
      return await this.provider.calculateDistance(userLat, userLng, vendorLat, vendorLng);
    } catch (error) {
      // Fallback to Haversine distance
      return this.fallbackDistance(userLat, userLng, vendorLat, vendorLng);
    }
  }

  private fallbackDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      distance,
      distanceText: `${distance.toFixed(1)} km`,
      duration: null,
      durationText: null,
      status: 'estimated',
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
