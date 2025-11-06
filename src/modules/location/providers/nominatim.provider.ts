import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { LocationProvider, LocationResponse, DistanceResponse } from '../interfaces/location-provider.interface';

@Injectable()
export class NominatimProvider implements LocationProvider {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  async autocompleteAddress(query: string, country: string = 'gh') {
    // Nominatim doesn't have autocomplete, return search results
    const response = await axios.get(`${this.baseUrl}/search`, {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        countrycodes: country.toLowerCase(),
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'LaundryServiceApp/1.0',
      },
    });

    return {
      predictions: response.data.map(result => ({
        placeId: result.place_id,
        description: result.display_name,
        mainText: result.name || result.display_name.split(',')[0],
        secondaryText: result.display_name.split(',').slice(1).join(',').trim(),
        coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
      })),
    };
  }

  async geocodeAddress(address: string): Promise<LocationResponse> {
    const response = await axios.get(`${this.baseUrl}/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        countrycodes: 'gh',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'LaundryServiceApp/1.0',
      },
    });

    if (response.data.length === 0) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }

    const result = response.data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      placeId: result.place_id,
      addressComponents: result.address,
    };
  }

  async getPlaceDetails(placeId: string): Promise<LocationResponse> {
    const response = await axios.get(`${this.baseUrl}/lookup`, {
      params: {
        osm_ids: placeId,
        format: 'json',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'LaundryServiceApp/1.0',
      },
    });

    if (response.data.length === 0) {
      throw new HttpException('Place not found', HttpStatus.NOT_FOUND);
    }

    const result = response.data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      placeId: result.place_id,
      addressComponents: result.address,
    };
  }

  async calculateDistance(userLat: number, userLng: number, vendorLat: number, vendorLng: number): Promise<DistanceResponse> {
    // Nominatim doesn't provide routing, use Haversine distance
    const distance = this.haversineDistance(userLat, userLng, vendorLat, vendorLng);
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
