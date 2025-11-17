import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { VendorsService } from '../vendors/services/vendors.service';

describe('LocationController - Mapbox Integration', () => {
  let controller: LocationController;
  let locationService: LocationService;

  const mockLocationService = {
    autocompleteAddress: jest.fn(),
    geocodeAddress: jest.fn(),
    getPlaceDetails: jest.fn(),
    calculateDistance: jest.fn(),
  };

  const mockVendorsService = {
    getVendorById: jest.fn(),
    searchVendors: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
        {
          provide: VendorsService,
          useValue: mockVendorsService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    locationService = module.get<LocationService>(LocationService);
  });

  describe('Mapbox Autocomplete', () => {
    it('should return Mapbox address suggestions', async () => {
      const mockResult = {
        predictions: [
          {
            placeId: 'address.123',
            description: 'Oxford Street, Osu, Accra, Ghana',
            mainText: 'Oxford Street',
            secondaryText: 'Osu, Accra, Ghana',
            coordinates: [-0.1870, 5.6037],
          },
        ],
      };

      mockLocationService.autocompleteAddress.mockResolvedValue(mockResult);

      const result = await controller.autocompleteAddress({ 
        query: 'oxford street', 
        country: 'GH' 
      });

      expect(result).toEqual(mockResult);
      expect(locationService.autocompleteAddress).toHaveBeenCalledWith('oxford street', 'GH');
    });
  });

  describe('Mapbox Geocoding', () => {
    it('should geocode address using Mapbox', async () => {
      const mockResult = {
        latitude: 5.6037,
        longitude: -0.1870,
        formattedAddress: 'Oxford Street, Osu, Accra, Ghana',
        placeId: 'address.123',
      };

      mockLocationService.geocodeAddress.mockResolvedValue(mockResult);

      const result = await controller.geocodeAddress({ 
        address: 'Oxford Street, Accra' 
      });

      expect(result).toEqual(mockResult);
      expect(locationService.geocodeAddress).toHaveBeenCalledWith('Oxford Street, Accra');
    });
  });

  describe('Mapbox Distance Calculation', () => {
    it('should calculate distance using Mapbox Directions API', async () => {
      const vendor = {
        id: 'vendor123',
        name: 'Clean Express',
        location: { coordinates: [-0.1875, 5.6040] },
        address: 'Test Address',
      };

      const mockDistance = {
        distance: 0.45,
        distanceText: '0.5 km',
        duration: 2,
        durationText: '2 mins',
        status: 'calculated',
      };

      mockVendorsService.getVendorById.mockResolvedValue(vendor);
      mockLocationService.calculateDistance.mockResolvedValue(mockDistance);

      const result = await controller.calculateDistance({
        userLatitude: 5.6037,
        userLongitude: -0.1870,
        vendorId: 'vendor123',
      });

      expect(result.vendor.id).toBe('vendor123');
      expect(result.distance).toBe(0.45);
      expect(result.distanceText).toBe('0.5 km');
      expect(locationService.calculateDistance).toHaveBeenCalledWith(
        5.6037, -0.1870, 5.6040, -0.1875
      );
    });
  });

  describe('Mapbox Nearby Vendors', () => {
    it('should find nearby vendors with Mapbox distances', async () => {
      const vendors = [
        {
          id: 'vendor1',
          name: 'Vendor 1',
          location: { coordinates: [-0.1875, 5.6040] },
          toObject: () => ({ id: 'vendor1', name: 'Vendor 1' }),
        },
      ];

      const mockDistance = {
        distance: 0.5,
        distanceText: '0.5 km',
        duration: 3,
        durationText: '3 mins',
        status: 'calculated',
      };

      mockVendorsService.searchVendors.mockResolvedValue(vendors);
      mockLocationService.calculateDistance.mockResolvedValue(mockDistance);

      const result = await controller.findNearbyVendors({
        latitude: 5.6037,
        longitude: -0.1870,
        radius: 5000,
      });

      expect(result[0].distance).toBe(0.5);
      expect(result[0].distanceText).toBe('0.5 km');
      expect(result[0].duration).toBe(3);
    });
  });
});
