export interface LocationProvider {
  autocompleteAddress(query: string, country?: string): Promise<any>;
  geocodeAddress(address: string): Promise<any>;
  getPlaceDetails?(placeId: string): Promise<any>;
  calculateDistance(userLat: number, userLng: number, vendorLat: number, vendorLng: number): Promise<any>;
}

export interface LocationResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
  addressComponents?: any;
}

export interface DistanceResponse {
  distance: number;
  distanceText?: string;
  duration?: number;
  durationText?: string;
  status: string;
}
