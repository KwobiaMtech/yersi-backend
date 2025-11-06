import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { VendorsService } from '../vendors/services/vendors.service';

describe('LocationController', () => {
  let controller: LocationController;
  let locationService: LocationService;
  let vendorsService: VendorsService;

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
    vendorsService = module.get<VendorsService>(VendorsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('autocompleteAddress', () => {
    it('should return address suggestions', async () => {
      const query = { query: 'oxford street', country: 'GH' };
      const result = {
        predictions: [
          {
            placeId: 'ChIJ123',
            description: 'Oxford Street, Accra, Ghana',
            mainText: 'Oxford Street',
            secondaryText: 'Accra, Ghana',
          },
        ],
      };

      mockLocationService.autocompleteAddress.mockResolvedValue(result);

      expect(await controller.autocompleteAddress(query)).toBe(result);
      expect(locationService.autocompleteAddress).toHaveBeenCalledWith(query.query, query.country);
    });
  });

  describe('geocodeAddress', () => {
    it('should convert address to coordinates', async () => {
      const dto = { address: 'Oxford Street, Accra' };
      const result = {
        latitude: 5.6037,
        longitude: -0.1870,
        formattedAddress: 'Oxford St, Accra, Ghana',
        placeId: 'ChIJ123',
      };

      mockLocationService.geocodeAddress.mockResolvedValue(result);

      expect(await controller.geocodeAddress(dto)).toBe(result);
      expect(locationService.geocodeAddress).toHaveBeenCalledWith(dto.address);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between user and vendor', async () => {
      const dto = {
        userLatitude: 5.6037,
        userLongitude: -0.1870,
        vendorId: 'vendor123',
      };

      const vendor = {
        id: 'vendor123',
        name: 'Clean Express',
        location: { coordinates: [-0.1875, 5.6040] },
        address: { street: '123 Main St', city: 'Accra' },
      };

      const distance = {
        distance: 0.45,
        distanceText: '450 m',
        duration: 2,
        durationText: '2 mins',
        status: 'calculated',
      };

      mockVendorsService.getVendorById.mockResolvedValue(vendor);
      mockLocationService.calculateDistance.mockResolvedValue(distance);

      const result = await controller.calculateDistance(dto);

      expect(result.vendor.id).toBe(vendor.id);
      expect(result.distance).toBe(distance.distance);
      expect(vendorsService.getVendorById).toHaveBeenCalledWith(dto.vendorId);
      expect(locationService.calculateDistance).toHaveBeenCalledWith(
        dto.userLatitude,
        dto.userLongitude,
        5.6040,
        -0.1875,
      );
    });
  });
});
