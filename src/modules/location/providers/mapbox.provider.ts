import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LocationProvider, LocationResponse, DistanceResponse } from '../interfaces/location-provider.interface';

@Injectable()
export class MapboxProvider implements LocationProvider {
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mapbox.com';

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN');
    if (!this.accessToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN is required for Mapbox provider');
    }
  }

  async autocompleteAddress(query: string, country: string = 'gh') {
    const response = await axios.get(`${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: this.accessToken,
        country: country.toLowerCase(),
        types: 'address,poi',
        limit: 5,
      },
    });

    return {
      predictions: response.data.features.map(feature => ({
        placeId: feature.id,
        description: feature.place_name,
        mainText: feature.text,
        secondaryText: feature.place_name.replace(feature.text + ', ', ''),
        coordinates: feature.center,
      })),
    };
  }

  async geocodeAddress(address: string): Promise<LocationResponse> {
    const response = await axios.get(`${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`, {
      params: {
        access_token: this.accessToken,
        limit: 1,
      },
    });

    if (response.data.features.length === 0) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }

    const feature = response.data.features[0];
    return {
      latitude: feature.center[1],
      longitude: feature.center[0],
      formattedAddress: feature.place_name,
      placeId: feature.id,
    };
  }

  async getPlaceDetails(placeId: string): Promise<LocationResponse> {
    // Mapbox doesn't have separate place details, return geocoding result
    const response = await axios.get(`${this.baseUrl}/geocoding/v5/mapbox.places/${placeId}.json`, {
      params: {
        access_token: this.accessToken,
      },
    });

    const feature = response.data.features[0];
    return {
      latitude: feature.center[1],
      longitude: feature.center[0],
      formattedAddress: feature.place_name,
      placeId: feature.id,
    };
  }

  async calculateDistance(userLat: number, userLng: number, vendorLat: number, vendorLng: number): Promise<DistanceResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/directions/v5/mapbox/driving/${userLng},${userLat};${vendorLng},${vendorLat}`, {
        params: {
          access_token: this.accessToken,
          geometries: 'geojson',
        },
      });

      const route = response.data.routes[0];
      return {
        distance: route.distance / 1000,
        distanceText: `${(route.distance / 1000).toFixed(1)} km`,
        duration: route.duration / 60,
        durationText: `${Math.round(route.duration / 60)} mins`,
        status: 'calculated',
      };
    } catch (error) {
      return this.fallbackDistance(userLat, userLng, vendorLat, vendorLng);
    }
  }

  private fallbackDistance(lat1: number, lng1: number, lat2: number, lng2: number): DistanceResponse {
    const distance = this.haversineDistance(lat1, lng1, lat2, lng2);
    return {
      distance,
      distanceText: `${distance.toFixed(1)} km`,
      duration: null,
      durationText: null,
      status: 'estimated',
    };
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
