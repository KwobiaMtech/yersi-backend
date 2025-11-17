import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { VendorsService } from '../vendors/services/vendors.service';

describe('Enhanced Nearby Vendors Test', () => {
  let controller: LocationController;

  const mockLocationService = {
    calculateDistance: jest.fn(),
  };

  const mockVendorsService = {
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
  });

  it('should find nearby vendors with real coordinates and distances', async () => {
    // Mock real vendor data from seeded database
    const mockVendorResult = {
      vendors: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Yes Laundry',
          rating: 4.6,
          totalReviews: 40,
          address: {
            street: 'Cantoments',
            city: 'Labone',
            region: 'Greater Accra',
          },
          location: {
            coordinates: [-0.1647, 5.5502], // Real geocoded coordinates
          },
          servicesOffered: ['Dry cleaning', 'Ironing', 'Laundry pick-up'],
          contact: '+233 55 869 6943',
          businessHours: '8:00 AM - 9:00 PM',
          deliveryFee: 10,
          estimatedPickupTime: 45,
          distance: 2.3,
          distanceText: '2.3 km',
          duration: 8,
          durationText: '8 mins',
          distanceStatus: 'calculated',
          isAvailable: true,
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Wash & Go Laundry',
          rating: 4.9,
          totalReviews: 25,
          address: {
            street: 'Tantra Hill',
            city: 'Adenta',
            region: 'Greater Accra',
          },
          location: {
            coordinates: [-0.1820, 5.6105], // Real geocoded coordinates
          },
          servicesOffered: ['Dry Cleaning', 'Carpet Cleaning'],
          contact: '507003923',
          businessHours: '7:00 AM - 8:00 PM',
          deliveryFee: 15,
          estimatedPickupTime: 30,
          distance: 5.7,
          distanceText: '5.7 km',
          duration: 15,
          durationText: '15 mins',
          distanceStatus: 'calculated',
          isAvailable: true,
        },
      ],
      total: 2,
      searchCriteria: {
        radius: 10000,
        includeDistance: true,
        sortBy: 'distance',
      },
    };

    mockVendorsService.searchVendors.mockResolvedValue(mockVendorResult);

    // Test from Oxford Street, Accra coordinates
    const result = await controller.findNearbyVendors({
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 10000,
    });

    console.log('\n=== ENHANCED NEARBY VENDORS TEST ===');
    console.log(`User Location: Oxford Street, Accra [5.6037, -0.1870]`);
    console.log(`Search Radius: 10km`);
    console.log(`Found ${result.total} vendors:\n`);

    result.vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.name}`);
      console.log(`   Rating: ${vendor.rating} ⭐ (${vendor.totalReviews} reviews)`);
      console.log(`   Address: ${vendor.address.full}`);
      console.log(`   Coordinates: [${vendor.location.latitude}, ${vendor.location.longitude}]`);
      console.log(`   Distance: ${vendor.distance.text} (${vendor.distance.durationText})`);
      console.log(`   Services: ${vendor.services.join(', ')}`);
      console.log(`   Contact: ${vendor.contact}`);
      console.log(`   Delivery Fee: GH₵${vendor.deliveryFee}`);
      console.log(`   Pickup Time: ${vendor.estimatedPickupTime} mins\n`);
    });

    expect(result.vendors).toHaveLength(2);
    expect(result.vendors[0].name).toBe('Yes Laundry');
    expect(result.vendors[0].location.coordinates).toEqual([-0.1647, 5.5502]);
    expect(result.vendors[0].distance.km).toBe(2.3);
    expect(result.userLocation.latitude).toBe(5.6037);
  });

  it('should sort vendors by distance from user location', async () => {
    const mockResult = {
      vendors: [
        {
          name: 'Closest Vendor',
          distance: 1.2,
          distanceText: '1.2 km',
          location: { coordinates: [-0.1870, 5.6040] },
        },
        {
          name: 'Farthest Vendor', 
          distance: 8.5,
          distanceText: '8.5 km',
          location: { coordinates: [-0.2500, 5.6500] },
        },
      ],
      total: 2,
      searchCriteria: { sortBy: 'distance' },
    };

    mockVendorsService.searchVendors.mockResolvedValue(mockResult);

    const result = await controller.findNearbyVendors({
      latitude: 5.6037,
      longitude: -0.1870,
      radius: 15000,
    });

    console.log('\n=== DISTANCE SORTING TEST ===');
    result.vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.name} - ${vendor.distance.text}`);
    });

    expect(result.vendors[0].distance.km).toBeLessThan(result.vendors[1].distance.km);
  });
});
