import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MapboxProvider } from './mapbox.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MapboxProvider', () => {
  let provider: MapboxProvider;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapboxProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-access-token'),
          },
        },
      ],
    }).compile();

    provider = module.get<MapboxProvider>(MapboxProvider);
  });

  describe('autocompleteAddress', () => {
    it('should return formatted address suggestions', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              id: 'address.123',
              place_name: 'Oxford Street, Osu, Accra, Ghana',
              text: 'Oxford Street',
              center: [-0.1870, 5.6037],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await provider.autocompleteAddress('oxford street', 'gh');

      expect(result.predictions[0]).toEqual({
        placeId: 'address.123',
        description: 'Oxford Street, Osu, Accra, Ghana',
        mainText: 'Oxford Street',
        secondaryText: 'Osu, Accra, Ghana',
        coordinates: [-0.1870, 5.6037],
      });
    });
  });

  describe('geocodeAddress', () => {
    it('should return location coordinates', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              id: 'address.123',
              place_name: 'Oxford Street, Osu, Accra, Ghana',
              center: [-0.1870, 5.6037],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await provider.geocodeAddress('Oxford Street, Accra');

      expect(result).toEqual({
        latitude: 5.6037,
        longitude: -0.1870,
        formattedAddress: 'Oxford Street, Osu, Accra, Ghana',
        placeId: 'address.123',
      });
    });

    it('should throw error when address not found', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] } });

      await expect(provider.geocodeAddress('Invalid Address')).rejects.toThrow(
        new HttpException('Address not found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('calculateDistance', () => {
    it('should return distance using Mapbox Directions API', async () => {
      const mockResponse = {
        data: {
          routes: [
            {
              distance: 1500,
              duration: 300,
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await provider.calculateDistance(5.6037, -0.1870, 5.6040, -0.1875);

      expect(result).toEqual({
        distance: 1.5,
        distanceText: '1.5 km',
        duration: 5,
        durationText: '5 mins',
        status: 'calculated',
      });
    });

    it('should fallback to Haversine when API fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await provider.calculateDistance(5.6037, -0.1870, 5.6040, -0.1875);

      expect(result.status).toBe('estimated');
      expect(result.distance).toBeCloseTo(0.05, 1);
      expect(result.duration).toBeNull();
    });
  });

  describe('getPlaceDetails', () => {
    it('should return place details', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              id: 'address.123',
              place_name: 'Oxford Street, Osu, Accra, Ghana',
              center: [-0.1870, 5.6037],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await provider.getPlaceDetails('address.123');

      expect(result).toEqual({
        latitude: 5.6037,
        longitude: -0.1870,
        formattedAddress: 'Oxford Street, Osu, Accra, Ghana',
        placeId: 'address.123',
      });
    });
  });
});
