import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LocationProvider, LocationResponse, DistanceResponse } from '../interfaces/location-provider.interface';

@Injectable()
export class GoogleMapsProvider implements LocationProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
  }

  async autocompleteAddress(query: string, country: string = 'GH') {
    if (!this.apiKey) {
      return { predictions: [] };
    }

    const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
      params: {
        input: query,
        components: `country:${country}`,
        types: 'address',
        key: this.apiKey,
      },
    });

    return {
      predictions: response.data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text,
      })),
    };
  }

  async geocodeAddress(address: string): Promise<LocationResponse> {
    if (!this.apiKey) {
      throw new HttpException('Google Maps API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const response = await axios.get(`${this.baseUrl}/geocode/json`, {
      params: { address, key: this.apiKey },
    });

    if (response.data.results.length === 0) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }

    const result = response.data.results[0];
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents: result.address_components,
    };
  }

  async getPlaceDetails(placeId: string): Promise<LocationResponse> {
    if (!this.apiKey) {
      throw new HttpException('Google Maps API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const response = await axios.get(`${this.baseUrl}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'geometry,formatted_address,address_components',
        key: this.apiKey,
      },
    });

    const result = response.data.result;
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      addressComponents: result.address_components,
    };
  }

  async calculateDistance(userLat: number, userLng: number, vendorLat: number, vendorLng: number): Promise<DistanceResponse> {
    if (!this.apiKey) {
      return this.fallbackDistance(userLat, userLng, vendorLat, vendorLng);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: `${userLat},${userLng}`,
          destinations: `${vendorLat},${vendorLng}`,
          units: 'metric',
          mode: 'driving',
          key: this.apiKey,
        },
      });

      const element = response.data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        return this.fallbackDistance(userLat, userLng, vendorLat, vendorLng);
      }

      return {
        distance: element.distance.value / 1000,
        distanceText: element.distance.text,
        duration: element.duration.value / 60,
        durationText: element.duration.text,
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
